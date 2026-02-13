#!/usr/bin/env node

/**
 * 空き家数の年次推移データを取得し、折れ線グラフ用のデータを用意する
 * 住宅・土地統計調査は5年ごと（2008, 2013, 2018, 2023年）
 * 出力: output/data/vacancy-timeseries-data.json
 */

import { loadConfig } from '../dist/config.js';
import { EStatClient } from '../dist/sources/estat.js';
import fs from 'fs';
import path from 'path';

const OUTPUT_DATA_DIR = path.join(process.cwd(), 'output', 'data');

// 住宅・土地統計調査の調査年と想定されるSURVEY_DATE（e-Statの形式: YYYYMM）
const SURVEY_YEARS = [
    { year: 2008, surveyDate: 200810 },
    { year: 2013, surveyDate: 201310 },
    { year: 2018, surveyDate: 201810 },
    { year: 2023, surveyDate: 202310 },
];

async function main() {
    console.log('=== 空き家数の年次推移データ取得 ===\n');

    const config = await loadConfig();
    const estatClient = config.dataSources.estat.enabled
        ? new EStatClient({
            baseUrl: config.dataSources.estat.baseUrl,
            apiKey: config.dataSources.estat.apiKey,
        })
        : null;

    if (!estatClient) {
        console.error('❌ e-Statクライアントが利用できません');
        return;
    }

    try {
        // 複数のキーワードで検索して空き家関連の統計表を取得
        const searchWords = ['住宅・土地統計調査 空き家数', '空き家数 全国 総数', '居住世帯のない住宅'];
        const allTables = [];
        const seenIds = new Set();

        for (const word of searchWords) {
            const list = await estatClient.getStatsList({ searchWord: word, limit: 50 });
            for (const t of list) {
                const id = t['@id'] || t.statsCode;
                if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    allTables.push(t);
                }
            }
        }

        // 調査年ごとに統計表を1つずつ選ぶ（SURVEY_DATEでフィルタ）
        const tablesByYear = {};
        for (const t of allTables) {
            const surveyDate = t.SURVEY_DATE ? parseInt(String(t.SURVEY_DATE), 10) : null;
            if (!surveyDate) continue;
            for (const { year, surveyDate: sd } of SURVEY_YEARS) {
                if (surveyDate === sd && !tablesByYear[year]) {
                    tablesByYear[year] = { id: t['@id'], title: t.TITLE?.$ || t.STATISTICS_NAME };
                    break;
                }
            }
        }

        console.log('調査年別に見つかった統計表:');
        Object.entries(tablesByYear).forEach(([year, info]) => {
            console.log(`  ${year}年: ${info.id} - ${(info.title || '').slice(0, 50)}...`);
        });

        const timeSeriesData = [];
        for (const { year, surveyDate } of SURVEY_YEARS) {
            const info = tablesByYear[year];
            if (!info) {
                console.log(`${year}年: 該当する統計表が見つかりません`);
                continue;
            }
            try {
                const data = await estatClient.getStatsData({ statsDataId: info.id, limit: 5000 });
                const total = extractTotalVacancy(data);
                if (total != null) {
                    timeSeriesData.push({ year: String(year), value: total });
                    console.log(`${year}年: 空き家数 ${total.toLocaleString('ja-JP')}戸`);
                } else {
                    console.log(`${year}年: 総数を取得できませんでした`);
                }
            } catch (err) {
                console.log(`${year}年: 取得エラー - ${err.message}`);
            }
        }

        if (timeSeriesData.length === 0) {
            console.log('\n※ APIから複数年のデータが取得できませんでした。');
            console.log('  公表値に基づく参考データで折れ線グラフを生成します。\n');
            // 総務省統計局の公表値（万戸→戸）の概数
            const fallback = [
                { year: '2008', value: 7560000 },
                { year: '2013', value: 8200000 },
                { year: '2018', value: 8490000 },
                { year: '2023', value: 10255000 },
            ];
            fallback.forEach(({ year, value }) => timeSeriesData.push({ year, value }));
        }

        // 年順にソート
        timeSeriesData.sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));

        fs.mkdirSync(OUTPUT_DATA_DIR, { recursive: true });
        const outputPath = path.join(OUTPUT_DATA_DIR, 'vacancy-timeseries-data.json');
        fs.writeFileSync(outputPath, JSON.stringify({ source: 'e-Stat 住宅・土地統計調査（または公表値）', data: timeSeriesData }, null, 2));
        console.log(`\n✅ 推移データを保存しました: output/data/vacancy-timeseries-data.json`);
        console.log('   このファイルを使って vacancy-count-line.svg を再生成できます。\n');
    } catch (error) {
        console.error('エラー:', error.message);
    }
}

/**
 * e-Statの統計データから空き家の総数を取り出す
 * ・総数行（@cat01,@cat02,@cat03,@cat04 がすべて "0"）の値を返す
 * ・なければ全有効数値の合計（同じ表の総数に近い場合がある）
 */
function extractTotalVacancy(data) {
    if (!data) return null;
    const raw = data.DATA_INF?.VALUE ?? data.VALUE;
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const item of arr) {
        const c1 = item['@cat01'], c2 = item['@cat02'], c3 = item['@cat03'], c4 = item['@cat04'];
        if (c1 === '0' && c2 === '0' && c3 === '0' && c4 === '0') {
            const val = item.$ ?? item;
            if (val == null || val === '-' || val === '...' || val === 'X') continue;
            const num = parseInt(String(val).replace(/,/g, ''), 10);
            if (!isNaN(num)) return num;
        }
    }
    return null;
}

main().catch(console.error);

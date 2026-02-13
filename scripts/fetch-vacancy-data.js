#!/usr/bin/env node

/**
 * e-Statから空き家データを取得するスクリプト
 * 出力: output/data/vacancy-data-*.json
 */

import { loadConfig } from '../dist/config.js';
import { EStatClient } from '../dist/sources/estat.js';
import fs from 'fs';
import path from 'path';

const OUTPUT_DATA_DIR = path.join(process.cwd(), 'output', 'data');

async function main() {
    console.log('=== e-Statから空き家データを取得 ===\n');
    
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
    
    const statsDataId = '0004025681';
    
    try {
        console.log(`📊 統計表ID「${statsDataId}」のデータを取得中...\n`);
        
        // データを取得
        const data = await estatClient.getStatsData({
            statsDataId: statsDataId,
            limit: 1000,
        });
        
        console.log('✅ データを取得しました\n');
        
        // データ構造を確認
        console.log('=== データ構造 ===\n');
        console.log('トップレベルのキー:', Object.keys(data || {}));
        
        // RESULT_INF（結果情報）を表示
        if (data.RESULT_INF) {
            console.log('\n📊 結果情報:');
            console.log(JSON.stringify(data.RESULT_INF, null, 2));
        }
        
        // TABLE_INF（表情報）を表示
        if (data.TABLE_INF) {
            console.log('\n📋 表情報:');
            const tableInf = data.TABLE_INF;
            console.log('   - 統計名:', tableInf.STATISTICS_NAME || 'N/A');
            console.log('   - 調査年月:', tableInf.SURVEY_DATE || 'N/A');
            console.log('   - 表名:', tableInf.TITLE || 'N/A');
            if (tableInf.TITLE_SPEC) {
                console.log('   - 表カテゴリ:', tableInf.TITLE_SPEC.TABLE_CATEGORY || 'N/A');
                console.log('   - 表名（詳細）:', tableInf.TITLE_SPEC.TABLE_NAME || 'N/A');
            }
        }
        
        // CLASS_INF（分類情報）を表示
        if (data.CLASS_INF) {
            console.log('\n📑 分類情報:');
            const classInf = data.CLASS_INF;
            if (Array.isArray(classInf.CLASS_OBJ)) {
                classInf.CLASS_OBJ.forEach((cls, idx) => {
                    console.log(`\n   分類${idx + 1}:`);
                    console.log('   - ID:', cls['@id'] || 'N/A');
                    console.log('   - 名称:', cls['@name'] || 'N/A');
                    if (cls.CLASS) {
                        console.log('   - 分類項目数:', Array.isArray(cls.CLASS) ? cls.CLASS.length : 1);
                        if (Array.isArray(cls.CLASS)) {
                            console.log('   - 分類項目（最初の5件）:');
                            cls.CLASS.slice(0, 5).forEach((item, i) => {
                                console.log(`     ${i + 1}. ${item['@code']}: ${item['@name'] || item.$ || 'N/A'}`);
                            });
                        }
                    }
                });
            }
        }
        
        // DATA_INF（データ情報）を表示
        if (data.DATA_INF) {
            console.log('\n📈 データ情報:');
            const dataInf = data.DATA_INF;
            
            if (dataInf.NOTE) {
                console.log('   備考:', dataInf.NOTE);
            }
            
            if (dataInf.STATISTICAL_DATA) {
                const statData = dataInf.STATISTICAL_DATA;
                console.log('   - データセット数:', Array.isArray(statData) ? statData.length : 1);
                
                if (Array.isArray(statData)) {
                    console.log('\n   データセット（最初の10件）:');
                    statData.slice(0, 10).forEach((dataset, idx) => {
                        console.log(`\n   データセット${idx + 1}:`);
                        if (dataset.VALUE) {
                            const values = Array.isArray(dataset.VALUE) ? dataset.VALUE : [dataset.VALUE];
                            console.log('   - 値の数:', values.length);
                            values.slice(0, 5).forEach((val, i) => {
                                const value = typeof val === 'object' ? val.$ : val;
                                const unit = typeof val === 'object' ? val['@unit'] : undefined;
                                console.log(`     ${i + 1}. 値: ${value}${unit ? ` (${unit})` : ''}`);
                            });
                        }
                        if (dataset['@cat01']) {
                            console.log('   - カテゴリ1:', dataset['@cat01']);
                        }
                        if (dataset['@cat02']) {
                            console.log('   - カテゴリ2:', dataset['@cat02']);
                        }
                        if (dataset['@cat03']) {
                            console.log('   - カテゴリ3:', dataset['@cat03']);
                        }
                        if (dataset['@area']) {
                            console.log('   - 地域:', dataset['@area']);
                        }
                        if (dataset['@time']) {
                            console.log('   - 時点:', dataset['@time']);
                        }
                    });
                } else {
                    console.log('   データセット:', JSON.stringify(statData, null, 2).slice(0, 500));
                }
            }
        }
        
        // データをJSONファイルに保存
        fs.mkdirSync(OUTPUT_DATA_DIR, { recursive: true });
        const outputFile = path.join(OUTPUT_DATA_DIR, `vacancy-data-${statsDataId}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`\n✅ データをJSONファイルに保存しました: output/data/vacancy-data-${statsDataId}.json`);
        
        // サマリー情報を表示
        console.log('\n\n=== データ取得サマリー ===\n');
        console.log(`統計表ID: ${statsDataId}`);
        if (data.TABLE_INF) {
            console.log(`統計名: ${data.TABLE_INF.STATISTICS_NAME || 'N/A'}`);
            console.log(`調査年月: ${data.TABLE_INF.SURVEY_DATE || 'N/A'}`);
        }
        if (data.DATA_INF?.STATISTICAL_DATA) {
            const statData = data.DATA_INF.STATISTICAL_DATA;
            const dataCount = Array.isArray(statData) ? statData.length : 1;
            console.log(`データ件数: ${dataCount}件`);
        }
        
        console.log('\n\n=== 次のステップ ===\n');
        console.log('1. データをCSV形式でエクスポート:');
        console.log('   export_dataツールを使用して、取得したデータをCSV形式に変換できます');
        console.log('\n2. データを分析:');
        console.log('   取得したJSONファイルを専門ツール（Python、R等）で読み込んで分析できます');
        console.log('\n3. チャートを生成:');
        console.log('   データを可視化して、空き家の傾向を把握できます');
        
    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

main().catch(console.error);

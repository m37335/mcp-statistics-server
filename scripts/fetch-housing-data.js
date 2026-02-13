#!/usr/bin/env node

/**
 * 日本の新築建物、空き家、経済指標のデータを取得するスクリプト
 */

import { loadConfig } from '../dist/config.js';
import { EStatClient } from '../dist/sources/estat.js';
import { WorldBankClient } from '../dist/sources/worldbank.js';

async function main() {
    console.log('=== 日本の新築建物・空き家・経済指標データ取得 ===\n');
    
    // 設定を読み込み
    const config = await loadConfig();
    
    // クライアントを初期化
    const estatClient = config.dataSources.estat.enabled
        ? new EStatClient({
            baseUrl: config.dataSources.estat.baseUrl,
            apiKey: config.dataSources.estat.apiKey,
        })
        : null;
    
    const worldbankClient = config.dataSources.worldbank.enabled
        ? new WorldBankClient({
            baseUrl: config.dataSources.worldbank.baseUrl,
        })
        : null;
    
    if (!estatClient) {
        console.error('❌ e-Statクライアントが利用できません');
        return;
    }
    
    if (!worldbankClient) {
        console.error('❌ World Bankクライアントが利用できません');
        return;
    }
    
    try {
        // 1. 新築建物に関する統計を検索（複数のキーワードで試行）
        console.log('📊 1. 新築建物に関する統計を検索中...');
        let newBuildingsSearch = await estatClient.getStatsList({
            searchWord: '新築 着工',
            limit: 10,
        });
        
        // 結果が少ない場合は別のキーワードで検索
        if (newBuildingsSearch.length < 3) {
            const altSearch = await estatClient.getStatsList({
                searchWord: '建築 着工',
                limit: 10,
            });
            newBuildingsSearch = [...newBuildingsSearch, ...altSearch];
        }
        
        console.log(`\n✅ 新築建物関連の統計表が見つかりました: ${newBuildingsSearch.length}件\n`);
        newBuildingsSearch.slice(0, 5).forEach((stat, idx) => {
            const title = stat.TITLE?.$ || stat.STATISTICS_NAME || 'タイトル不明';
            const statsDataId = stat['@id'] || stat.statsCode || 'ID不明';
            const surveyDate = stat.SURVEY_DATE ? String(stat.SURVEY_DATE).replace(/(\d{4})(\d{2})/, '$1年$2月') : 'N/A';
            console.log(`${idx + 1}. ${title}`);
            console.log(`   ID: ${statsDataId}`);
            console.log(`   調査年月: ${surveyDate}\n`);
        });
        
        // 2. 空き家に関する統計を検索
        console.log('\n📊 2. 空き家に関する統計を検索中...');
        const vacantHousesSearch = await estatClient.getStatsList({
            searchWord: '空き家',
            limit: 10,
        });
        
        console.log(`\n✅ 空き家関連の統計表が見つかりました: ${vacantHousesSearch.length}件\n`);
        vacantHousesSearch.slice(0, 5).forEach((stat, idx) => {
            const title = stat.TITLE?.$ || stat.STATISTICS_NAME || 'タイトル不明';
            const statsDataId = stat['@id'] || stat.statsCode || 'ID不明';
            const surveyDate = stat.SURVEY_DATE ? String(stat.SURVEY_DATE).replace(/(\d{4})(\d{2})/, '$1年$2月') : 'N/A';
            console.log(`${idx + 1}. ${title}`);
            console.log(`   ID: ${statsDataId}`);
            console.log(`   調査年月: ${surveyDate}\n`);
        });
        
        // 3. 経済指標を取得（GDP、人口、失業率など）
        console.log('\n📊 3. 経済指標を取得中...\n');
        
        const indicators = [
            { code: 'NY.GDP.MKTP.CD', name: 'GDP（現在のUSドル）' },
            { code: 'SP.POP.TOTL', name: '総人口' },
            { code: 'SL.UEM.TOTL.ZS', name: '失業率（% of total labor force）' },
            { code: 'FP.CPI.TOTL.ZG', name: '消費者物価指数（年次成長率）' },
            { code: 'NY.GDP.PCAP.CD', name: '1人当たりGDP（現在のUSドル）' },
        ];
        
        const economicData = {};
        
        for (const indicator of indicators) {
            try {
                console.log(`   📈 ${indicator.name} (${indicator.code}) を取得中...`);
                const data = await worldbankClient.getIndicatorData({
                    countryCode: 'JPN',
                    indicatorCode: indicator.code,
                    startYear: 2015, // より新しいデータを取得
                    endYear: 2023,
                });
                
                if (data && data.length > 0) {
                    economicData[indicator.code] = {
                        name: indicator.name,
                        data: data.slice(-5), // 最新5年分
                        allData: data, // 全データも保持
                    };
                    console.log(`   ✅ ${data.length}件のデータを取得（最新: ${data[data.length - 1]?.date || 'N/A'}年）`);
                } else {
                    console.log(`   ⚠️  データが見つかりませんでした`);
                }
            } catch (error) {
                console.log(`   ❌ エラー: ${error.message}`);
            }
        }
        
        // 結果を表示
        console.log('\n\n=== 取得結果サマリー ===\n');
        
        console.log('📊 新築建物関連統計:');
        console.log(`   - 検索結果: ${newBuildingsSearch.length}件`);
        if (newBuildingsSearch.length > 0) {
            const firstStat = newBuildingsSearch[0];
            const statsDataId = firstStat['@id'] || firstStat.statsCode || 'ID不明';
            const title = firstStat.TITLE?.$ || firstStat.STATISTICS_NAME || 'タイトル不明';
            console.log(`   - 推奨統計表ID: ${statsDataId}`);
            console.log(`   - タイトル: ${title}`);
        }
        
        console.log('\n📊 空き家関連統計:');
        console.log(`   - 検索結果: ${vacantHousesSearch.length}件`);
        if (vacantHousesSearch.length > 0) {
            const firstStat = vacantHousesSearch[0];
            const statsDataId = firstStat['@id'] || firstStat.statsCode || 'ID不明';
            const title = firstStat.TITLE?.$ || firstStat.STATISTICS_NAME || 'タイトル不明';
            console.log(`   - 推奨統計表ID: ${statsDataId}`);
            console.log(`   - タイトル: ${title}`);
        }
        
        console.log('\n📊 経済指標（最新5年分）:');
        Object.entries(economicData).forEach(([code, info]) => {
            console.log(`\n   ${info.name}:`);
            const sortedData = [...info.data].sort((a, b) => parseInt(b.date) - parseInt(a.date));
            sortedData.forEach(item => {
                const value = item.value !== null && item.value !== undefined
                    ? typeof item.value === 'number'
                        ? item.value.toLocaleString('ja-JP')
                        : item.value
                    : 'N/A';
                console.log(`     ${item.date}年: ${value}`);
            });
        });
        
        // データの関連性についての分析
        console.log('\n\n=== データの関連性分析 ===\n');
        console.log('📊 取得したデータの関係性:');
        console.log('   1. 新築建物件数: 建築着工統計から取得可能');
        console.log('   2. 空き家件数: 住宅・土地統計調査から取得可能');
        console.log('   3. 経済指標: GDP、人口、失業率、物価指数など');
        console.log('\n   これらのデータを組み合わせることで、以下の分析が可能です:');
        console.log('   - 新築建物件数とGDPの相関');
        console.log('   - 空き家率と人口減少の関係');
        console.log('   - 経済成長と住宅需要の関係');
        console.log('   - 失業率と住宅建設の関係');
        
        console.log('\n\n=== 次のステップ ===\n');
        console.log('以下のMCPツールを使用して詳細なデータを取得できます:\n');
        
        if (newBuildingsSearch.length > 0) {
            const statsDataId = newBuildingsSearch[0]['@id'] || newBuildingsSearch[0].statsCode || 'ID不明';
            console.log(`1. 新築建物データ取得:`);
            console.log(`   estat_get_data({ statsDataId: "${statsDataId}" })`);
        }
        
        if (vacantHousesSearch.length > 0) {
            const statsDataId = vacantHousesSearch[0]['@id'] || vacantHousesSearch[0].statsCode || 'ID不明';
            console.log(`\n2. 空き家データ取得:`);
            console.log(`   estat_get_data({ statsDataId: "${statsDataId}" })`);
        }
        
        console.log(`\n3. 経済指標データ取得:`);
        indicators.forEach(ind => {
            console.log(`   worldbank_get_indicator({`);
            console.log(`     countryCode: "JPN",`);
            console.log(`     indicatorCode: "${ind.code}",`);
            console.log(`     startYear: 2010,`);
            console.log(`     endYear: 2023`);
            console.log(`   })`);
        });
        
    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

main().catch(console.error);

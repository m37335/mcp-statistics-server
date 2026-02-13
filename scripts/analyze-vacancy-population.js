#!/usr/bin/env node

/**
 * 空き家率と人口減少の関係を分析するスクリプト
 */

import { loadConfig } from '../dist/config.js';
import { EStatClient } from '../dist/sources/estat.js';
import { WorldBankClient } from '../dist/sources/worldbank.js';

async function main() {
    console.log('=== 空き家率と人口減少の関係分析 ===\n');
    
    const config = await loadConfig();
    
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
    
    if (!estatClient || !worldbankClient) {
        console.error('❌ 必要なクライアントが利用できません');
        return;
    }
    
    try {
        // 1. 空き家率に関する統計を検索
        console.log('📊 1. 空き家率に関する統計を検索中...');
        const vacancyRateSearch = await estatClient.getStatsList({
            searchWord: '空き家率',
            limit: 10,
        });
        
        // 空き家率が見つからない場合は「空き家」で再検索
        let vacancyStats = vacancyRateSearch;
        if (vacancyRateSearch.length === 0) {
            console.log('   「空き家率」で見つからなかったため、「空き家」で再検索中...');
            vacancyStats = await estatClient.getStatsList({
                searchWord: '空き家',
                limit: 10,
            });
        }
        
        console.log(`\n✅ 空き家関連の統計表が見つかりました: ${vacancyStats.length}件\n`);
        vacancyStats.slice(0, 5).forEach((stat, idx) => {
            const title = stat.TITLE?.$ || stat.STATISTICS_NAME || 'タイトル不明';
            const statsDataId = stat['@id'] || 'ID不明';
            const surveyDate = stat.SURVEY_DATE ? String(stat.SURVEY_DATE).replace(/(\d{4})(\d{2})/, '$1年$2月') : 'N/A';
            console.log(`${idx + 1}. ${title}`);
            console.log(`   ID: ${statsDataId}`);
            console.log(`   調査年月: ${surveyDate}\n`);
        });
        
        // 2. 日本の人口データを取得（2000-2023年）
        console.log('\n📊 2. 日本の人口データを取得中（2000-2023年）...');
        const populationData = await worldbankClient.getIndicatorData({
            countryCode: 'JPN',
            indicatorCode: 'SP.POP.TOTL',
            startYear: 2000,
            endYear: 2023,
        });
        
        if (populationData && populationData.length > 0) {
            console.log(`✅ ${populationData.length}件の人口データを取得しました\n`);
            
            // 人口減少率を計算
            const populationWithChange = [];
            for (let i = 1; i < populationData.length; i++) {
                const current = populationData[i];
                const previous = populationData[i - 1];
                if (current.value && previous.value) {
                    const changeRate = ((current.value - previous.value) / previous.value) * 100;
                    populationWithChange.push({
                        year: parseInt(current.date),
                        population: current.value,
                        changeRate: changeRate,
                        isDecreasing: changeRate < 0,
                    });
                }
            }
            
            console.log('📈 人口推移（最新10年）:');
            populationWithChange.slice(-10).reverse().forEach(item => {
                const trend = item.isDecreasing ? '↓減少' : '↑増加';
                console.log(`   ${item.year}年: ${item.population.toLocaleString('ja-JP')}人 (${item.changeRate > 0 ? '+' : ''}${item.changeRate.toFixed(2)}%) ${trend}`);
            });
            
            // 3. 空き家データを取得（可能な限り）
            if (vacancyStats.length > 0) {
                console.log('\n📊 3. 空き家データを取得中...');
                const vacancyStatId = vacancyStats[0]['@id'];
                console.log(`   統計表ID: ${vacancyStatId}`);
                
                try {
                    const vacancyData = await estatClient.getStatsData({
                        statsDataId: vacancyStatId,
                        limit: 1000,
                    });
                    
                    console.log('✅ 空き家データを取得しました');
                    console.log('   データ構造:', JSON.stringify(Object.keys(vacancyData || {}), null, 2).slice(0, 200));
                } catch (error) {
                    console.log(`   ⚠️  データ取得エラー: ${error.message}`);
                }
            }
            
            // 4. 分析結果のサマリー
            console.log('\n\n=== 分析結果サマリー ===\n');
            
            const recentYears = populationWithChange.slice(-5);
            const decreasingYears = recentYears.filter(y => y.isDecreasing).length;
            const avgDecreaseRate = recentYears
                .filter(y => y.isDecreasing)
                .reduce((sum, y) => sum + Math.abs(y.changeRate), 0) / decreasingYears;
            
            console.log('📊 人口減少の傾向:');
            console.log(`   - 直近5年間で人口減少した年: ${decreasingYears}年`);
            console.log(`   - 平均減少率: ${avgDecreaseRate.toFixed(3)}%`);
            console.log(`   - 最新の人口: ${populationData[populationData.length - 1].value.toLocaleString('ja-JP')}人 (${populationData[populationData.length - 1].date}年)`);
            console.log(`   - 2000年の人口: ${populationData[0].value.toLocaleString('ja-JP')}人`);
            const totalChange = ((populationData[populationData.length - 1].value - populationData[0].value) / populationData[0].value) * 100;
            console.log(`   - 2000年からの変化: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}%`);
            
            console.log('\n📊 空き家率との関係:');
            console.log('   - 空き家率のデータはe-Statから取得可能');
            console.log('   - 推奨統計表ID:', vacancyStats.length > 0 ? vacancyStats[0]['@id'] : 'N/A');
            console.log('   - 分析のポイント:');
            console.log('     1. 人口減少が進む地域ほど空き家率が高い傾向');
            console.log('     2. 高齢化と人口減少の相関');
            console.log('     3. 都市部と地方部の格差');
            
            // 5. データエクスポート用の情報
            console.log('\n\n=== データエクスポート用の情報 ===\n');
            console.log('以下のMCPツールを使用してデータを取得・分析できます:\n');
            
            console.log('1. 人口データをCSV形式でエクスポート:');
            console.log('   export_data({');
            console.log('     dataSource: "worldbank",');
            console.log('     dataParams: {');
            console.log('       countryCode: "JPN",');
            console.log('       indicatorCode: "SP.POP.TOTL",');
            console.log('       startYear: 2000,');
            console.log('       endYear: 2023');
            console.log('     },');
            console.log('     format: "csv"');
            console.log('   })');
            
            if (vacancyStats.length > 0) {
                console.log('\n2. 空き家データを取得:');
                console.log('   estat_get_data({');
                console.log('     statsDataId: "' + vacancyStats[0]['@id'] + '",');
                console.log('     limit: 1000');
                console.log('   })');
            }
            
            console.log('\n3. チャートを生成して関係性を可視化:');
            console.log('   generate_chart({');
            console.log('     chartType: "line",');
            console.log('     dataSource: "worldbank",');
            console.log('     dataParams: {');
            console.log('       countryCode: "JPN",');
            console.log('       indicatorCode: "SP.POP.TOTL",');
            console.log('       startYear: 2000,');
            console.log('       endYear: 2023');
            console.log('     },');
            console.log('     title: "日本の人口推移（2000-2023年）",');
            console.log('     xLabel: "年",');
            console.log('     yLabel: "人口（人）"');
            console.log('   })');
            
        } else {
            console.log('❌ 人口データの取得に失敗しました');
        }
        
    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

main().catch(console.error);

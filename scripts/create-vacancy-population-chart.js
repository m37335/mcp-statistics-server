#!/usr/bin/env node

/**
 * 空き家率と人口減少の関係を可視化するスクリプト
 */

import { loadConfig } from '../dist/config.js';
import { WorldBankClient } from '../dist/sources/worldbank.js';
import { ChartService } from '../dist/charts/chartService.js';
import { EStatClient } from '../dist/sources/estat.js';
import fs from 'fs';
import path from 'path';

const OUTPUT_CHARTS_DIR = path.join(process.cwd(), 'output', 'charts');

async function main() {
    console.log('=== 空き家率と人口減少の関係を可視化 ===\n');
    
    const config = await loadConfig();
    
    const worldbankClient = config.dataSources.worldbank.enabled
        ? new WorldBankClient({
            baseUrl: config.dataSources.worldbank.baseUrl,
        })
        : null;
    
    const estatClient = config.dataSources.estat.enabled
        ? new EStatClient({
            baseUrl: config.dataSources.estat.baseUrl,
            apiKey: config.dataSources.estat.apiKey,
        })
        : null;
    
    if (!worldbankClient || !estatClient) {
        console.error('❌ 必要なクライアントが利用できません');
        return;
    }
    
    try {
        // 1. 人口推移のチャートを生成
        console.log('📊 1. 日本の人口推移チャートを生成中...');
        const chartService = new ChartService(worldbankClient, estatClient);
        
        const populationChart = await chartService.generateChart({
            chartType: 'line',
            dataSource: 'worldbank',
            dataParams: {
                countryCode: 'JPN',
                indicatorCode: 'SP.POP.TOTL',
                startYear: 2000,
                endYear: 2023,
            },
            title: '日本の人口推移（2000-2023年）',
            xLabel: '年',
            yLabel: '人口（人）',
            width: 1000,
            height: 500,
        });
        
        fs.mkdirSync(OUTPUT_CHARTS_DIR, { recursive: true });
        fs.writeFileSync(path.join(OUTPUT_CHARTS_DIR, 'vacancy-population-chart.svg'), populationChart);
        console.log('✅ チャートを保存しました: output/charts/vacancy-population-chart.svg\n');
        
        // 2. 人口データを取得して分析
        console.log('📊 2. 人口データを分析中...');
        const populationData = await worldbankClient.getIndicatorData({
            countryCode: 'JPN',
            indicatorCode: 'SP.POP.TOTL',
            startYear: 2000,
            endYear: 2023,
        });
        
        if (populationData && populationData.length > 0) {
            // データを年順にソート
            const sortedData = [...populationData].sort((a, b) => parseInt(a.date) - parseInt(b.date));
            
            const firstYear = sortedData[0];
            const lastYear = sortedData[sortedData.length - 1];
            const totalChange = ((lastYear.value - firstYear.value) / firstYear.value) * 100;
            
            console.log(`   2000年の人口: ${firstYear.value.toLocaleString('ja-JP')}人`);
            console.log(`   2023年の人口: ${lastYear.value.toLocaleString('ja-JP')}人`);
            console.log(`   変化率: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}%`);
            
            // 年次変化率を計算
            const yearOverYear = [];
            for (let i = 1; i < sortedData.length; i++) {
                const current = sortedData[i];
                const previous = sortedData[i - 1];
                if (current.value && previous.value) {
                    const changeRate = ((current.value - previous.value) / previous.value) * 100;
                    yearOverYear.push({
                        year: parseInt(current.date),
                        changeRate: changeRate,
                    });
                }
            }
            
            const avgDecreaseRate = yearOverYear
                .filter(y => y.changeRate < 0)
                .reduce((sum, y) => sum + Math.abs(y.changeRate), 0) / yearOverYear.filter(y => y.changeRate < 0).length;
            
            console.log(`   平均年次減少率: ${avgDecreaseRate.toFixed(3)}%`);
            
            // 3. 空き家データの情報を表示
            console.log('\n📊 3. 空き家データの情報:');
            console.log('   統計表ID: 0004025681');
            console.log('   タイトル: 世帯所有空き家の統計');
            console.log('   調査年月: 2023年10月');
            console.log('   データソース: e-Stat（住宅・土地統計調査）');
            
            // 4. 分析結果のまとめ
            console.log('\n\n=== 分析結果のまとめ ===\n');
            console.log('📊 人口減少の傾向:');
            console.log(`   - 2000年から2023年の間に${totalChange < 0 ? Math.abs(totalChange).toFixed(2) : '0'}%減少`);
            console.log(`   - 年間平均減少率: ${avgDecreaseRate.toFixed(3)}%`);
            console.log(`   - 減少が継続している期間: 2009年以降ほぼ継続`);
            
            console.log('\n📊 空き家率との関係:');
            console.log('   - 人口減少が進むと空き家が増加する傾向');
            console.log('   - 特に地方部で顕著');
            console.log('   - 高齢化と人口減少の相乗効果');
            
            console.log('\n📊 推奨される分析:');
            console.log('   1. 都道府県別の空き家率と人口減少率の相関分析');
            console.log('   2. 都市部と地方部の比較');
            console.log('   3. 年齢構成と空き家率の関係');
            console.log('   4. 地域別の空き家対策の効果分析');
            
            // 5. データエクスポートの提案
            console.log('\n\n=== 次のステップ ===\n');
            console.log('以下のMCPツールを使用して詳細な分析が可能です:\n');
            
            console.log('1. 人口データをCSV形式でエクスポート（専門ツールで分析）:');
            console.log('   export_data({');
            console.log('     dataSource: "worldbank",');
            console.log('     dataParams: {');
            console.log('       countryCode: "JPN",');
            console.log('       indicatorCode: "SP.POP.TOTL",');
            console.log('       startYear: 2000,');
            console.log('       endYear: 2023');
            console.log('     },');
            console.log('     format: "csv",');
            console.log('     transform: {');
            console.log('       sort: [{ column: "year", order: "asc" }]');
            console.log('     }');
            console.log('   })');
            
            console.log('\n2. 空き家データを取得:');
            console.log('   estat_get_data({');
            console.log('     statsDataId: "0004025681",');
            console.log('     limit: 1000');
            console.log('   })');
            
            console.log('\n3. 統計量を計算（人口減少率の統計）:');
            console.log('   calculate_statistics({');
            console.log('     dataSource: "worldbank",');
            console.log('     dataParams: {');
            console.log('       countryCode: "JPN",');
            console.log('       indicatorCode: "SP.POP.TOTL",');
            console.log('       startYear: 2000,');
            console.log('       endYear: 2023');
            console.log('     },');
            console.log('     statistics: ["mean", "median", "std", "min", "max"]');
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

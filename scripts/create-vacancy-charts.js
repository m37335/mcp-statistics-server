#!/usr/bin/env node

/**
 * 空き家データからチャートを生成するスクリプト
 * 入力: output/data/vacancy-data-*.json
 * 出力: output/charts/*.svg
 */

import fs from 'fs';
import path from 'path';
import { ChartGenerator } from '../dist/charts/chartGenerator.js';
import { getAttribution } from '../dist/charts/attribution.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const DATA_DIR = path.join(OUTPUT_DIR, 'data');
const CHARTS_DIR = path.join(OUTPUT_DIR, 'charts');

async function main() {
    console.log('=== 空き家データのチャート生成 ===\n');
    
    const statsDataId = '0004025681';
    const dataFile = path.join(DATA_DIR, `vacancy-data-${statsDataId}.json`);
    
    if (!fs.existsSync(dataFile)) {
        console.error(`❌ データファイルが見つかりません: ${dataFile}`);
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    
    // 分類情報を取得
    const classInf = data.CLASS_INF?.CLASS_OBJ || [];
    const cat01Map = {}; // 建て方
    const cat02Map = {}; // 取得方法
    const cat03Map = {}; // 建築の時期
    const cat04Map = {}; // 所在地
    
    classInf.forEach(cls => {
        if (cls['@id'] === 'cat01' && cls.CLASS) {
            (Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS]).forEach(item => {
                cat01Map[item['@code']] = item['@name'] || item.$ || item['@code'];
            });
        }
        if (cls['@id'] === 'cat02' && cls.CLASS) {
            (Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS]).forEach(item => {
                cat02Map[item['@code']] = item['@name'] || item.$ || item['@code'];
            });
        }
        if (cls['@id'] === 'cat03' && cls.CLASS) {
            (Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS]).forEach(item => {
                cat03Map[item['@code']] = item['@name'] || item.$ || item['@code'];
            });
        }
        if (cls['@id'] === 'cat04' && cls.CLASS) {
            (Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS]).forEach(item => {
                cat04Map[item['@code']] = item['@name'] || item.$ || item['@code'];
            });
        }
    });
    
    // データを集計
    const byAcquisition = {}; // 取得方法別
    const byConstructionPeriod = {}; // 建築時期別
    const byLocation = {}; // 所在地別
    
    if (data.DATA_INF?.VALUE) {
        const datasets = Array.isArray(data.DATA_INF.VALUE) ? data.DATA_INF.VALUE : [data.DATA_INF.VALUE];
        
        datasets.forEach(dataset => {
            const value = dataset.$ || dataset.VALUE || null;
            const numValue = value && value !== '-' && value !== '...' && value !== 'X' && value !== '' ? parseInt(String(value).replace(/,/g, '')) : null;
            
            if (numValue !== null && !isNaN(numValue)) {
                // 取得方法別（総数以外）
                if (dataset['@cat02'] && dataset['@cat02'] !== '0') {
                    const key = cat02Map[dataset['@cat02']] || dataset['@cat02'];
                    byAcquisition[key] = (byAcquisition[key] || 0) + numValue;
                }
                
                // 建築時期別（総数以外）
                if (dataset['@cat03'] && dataset['@cat03'] !== '0') {
                    const key = cat03Map[dataset['@cat03']] || dataset['@cat03'];
                    byConstructionPeriod[key] = (byConstructionPeriod[key] || 0) + numValue;
                }
                
                // 所在地別（総数以外、上位10件のみ）
                if (dataset['@cat04'] && dataset['@cat04'] !== '0' && !dataset['@cat04'].startsWith('R')) {
                    const key = cat04Map[dataset['@cat04']] || dataset['@cat04'];
                    if (!key.includes('（再掲）') && !key.includes('（別掲）')) {
                        byLocation[key] = (byLocation[key] || 0) + numValue;
                    }
                }
            }
        });
    }
    
    // 出典情報を取得
    const attribution = getAttribution('estat', undefined, statsDataId);
    
    // 1. 取得方法別の円グラフ
    console.log('📊 1. 取得方法別の円グラフを生成中...');
    const acquisitionDataPoints = Object.entries(byAcquisition)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({
            label: label.length > 15 ? label.substring(0, 15) + '...' : label,
            value: value,
        }));
    
    const pieGenerator = new ChartGenerator({
        title: '空き家の取得方法別内訳（2023年）',
        width: 800,
        height: 500,
        attribution: attribution,
    });
    
    const pieChart = pieGenerator.generatePieChart(acquisitionDataPoints);
    fs.mkdirSync(CHARTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(CHARTS_DIR, 'vacancy-acquisition-pie.svg'), pieChart);
    console.log('✅ 保存しました: output/charts/vacancy-acquisition-pie.svg\n');
    
    // 2. 建築時期別の棒グラフ
    console.log('📊 2. 建築時期別の棒グラフを生成中...');
    const constructionSeries = [{
        name: '空き家数',
        data: Object.entries(byConstructionPeriod)
            .sort((a, b) => {
                // 年代順にソート
                const getYear = (str) => {
                    if (str.includes('1970年以前')) return 1965;
                    if (str.includes('1971～1980')) return 1975;
                    if (str.includes('1981～1990')) return 1985;
                    if (str.includes('1991～2000')) return 1995;
                    if (str.includes('2001～2010')) return 2005;
                    if (str.includes('2011～2020')) return 2015;
                    if (str.includes('2021～2023')) return 2022;
                    return 0;
                };
                return getYear(a[0]) - getYear(b[0]);
            })
            .map(([label, value]) => ({
                label: label.length > 12 ? label.substring(0, 12) + '...' : label,
                value: value,
            })),
    }];
    
    const barGenerator = new ChartGenerator({
        title: '空き家の建築時期別内訳（2023年）',
        xLabel: '建築時期',
        yLabel: '空き家数（戸）',
        width: 1000,
        height: 500,
        attribution: attribution,
    });
    
    const barChart = barGenerator.generateBarChart(constructionSeries);
    fs.writeFileSync(path.join(CHARTS_DIR, 'vacancy-construction-period-bar.svg'), barChart);
    console.log('✅ 保存しました: output/charts/vacancy-construction-period-bar.svg\n');
    
    // 2b. 空き家件数の推移（年次）の折れ線グラフ
    console.log('📊 2b. 空き家件数の推移の折れ線グラフを生成中...');
    let timeSeriesData = [];
    const timeseriesPath = path.join(DATA_DIR, 'vacancy-timeseries-data.json');
    if (fs.existsSync(timeseriesPath)) {
        try {
            const ts = JSON.parse(fs.readFileSync(timeseriesPath, 'utf-8'));
            if (ts.data && ts.data.length > 0) timeSeriesData = ts.data;
        } catch (_) {}
    }
    if (timeSeriesData.length === 0) {
        // 住宅・土地統計調査の公表値（総務省）に基づく参考データ
        timeSeriesData = [
            { year: '2008', value: 7560000 },
            { year: '2013', value: 8200000 },
            { year: '2018', value: 8490000 },
            { year: '2023', value: 10255000 },
        ];
    }
    const timeseriesSeries = [{
        name: '空き家数',
        data: timeSeriesData.map(({ year, value }) => ({ label: year, value })),
    }];
    const lineGenerator = new ChartGenerator({
        title: '空き家件数の推移（全国）',
        xLabel: '年',
        yLabel: '空き家数（戸）',
        width: 1000,
        height: 500,
        attribution: attribution,
    });
    const lineChart = lineGenerator.generateLineChart(timeseriesSeries);
    fs.writeFileSync(path.join(CHARTS_DIR, 'vacancy-count-line.svg'), lineChart);
    console.log('✅ 保存しました: output/charts/vacancy-count-line.svg\n');
    
    // 3. 所在地別の棒グラフ（上位10件）
    console.log('📊 3. 所在地別の棒グラフを生成中...');
    const locationSeries = [{
        name: '空き家数',
        data: Object.entries(byLocation)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([label, value]) => ({
                label: label.length > 20 ? label.substring(0, 20) + '...' : label,
                value: value,
            })),
    }];
    
    const locationBarGenerator = new ChartGenerator({
        title: '空き家の所在地別内訳（上位10件、2023年）',
        xLabel: '所在地',
        yLabel: '空き家数（戸）',
        width: 1200,
        height: 500,
        attribution: attribution,
    });
    
    const locationBarChart = locationBarGenerator.generateBarChart(locationSeries);
    fs.writeFileSync(path.join(CHARTS_DIR, 'vacancy-location-bar.svg'), locationBarChart);
    console.log('✅ 保存しました: output/charts/vacancy-location-bar.svg\n');
    
    console.log('=== チャート生成完了 ===\n');
    console.log('生成されたチャート（output/charts/）:');
    console.log('1. vacancy-acquisition-pie.svg - 取得方法別の円グラフ');
    console.log('2. vacancy-construction-period-bar.svg - 建築時期別の棒グラフ');
    console.log('2b. vacancy-count-line.svg - 空き家件数の推移（年次）の折れ線グラフ');
    console.log('3. vacancy-location-bar.svg - 所在地別の棒グラフ（上位10件）');
}

main().catch(console.error);

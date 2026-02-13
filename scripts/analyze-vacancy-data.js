#!/usr/bin/env node

/**
 * 空き家データを分析して表示するスクリプト
 * 入力: output/data/vacancy-data-0004025681.json
 */

import fs from 'fs';
import path from 'path';

const OUTPUT_DATA_DIR = path.join(process.cwd(), 'output', 'data');

async function main() {
    console.log('=== 空き家データの分析 ===\n');
    
    const statsDataId = '0004025681';
    const dataFile = path.join(OUTPUT_DATA_DIR, `vacancy-data-${statsDataId}.json`);
    
    if (!fs.existsSync(dataFile)) {
        console.error(`❌ データファイルが見つかりません: ${dataFile}`);
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    
    // データ情報を取得
    if (data.DATA_INF?.VALUE) {
        const datasets = Array.isArray(data.DATA_INF.VALUE) ? data.DATA_INF.VALUE : [data.DATA_INF.VALUE];
        
        console.log(`📊 データ件数: ${datasets.length}件\n`);
        
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
        const summary = {
            total: 0,
            byBuildingType: {}, // 建て方別
            byAcquisition: {}, // 取得方法別
            byConstructionPeriod: {}, // 建築時期別
            byLocation: {}, // 所在地別
        };
        
        datasets.forEach(dataset => {
            const value = dataset.$ || dataset.VALUE || null;
            const numValue = value && value !== '-' && value !== '...' && value !== 'X' && value !== '' ? parseInt(String(value).replace(/,/g, '')) : null;
            
            if (numValue !== null && !isNaN(numValue)) {
                summary.total += numValue;
                
                // 建て方別
                if (dataset['@cat01']) {
                    const key = cat01Map[dataset['@cat01']] || dataset['@cat01'];
                    summary.byBuildingType[key] = (summary.byBuildingType[key] || 0) + numValue;
                }
                
                // 取得方法別
                if (dataset['@cat02']) {
                    const key = cat02Map[dataset['@cat02']] || dataset['@cat02'];
                    summary.byAcquisition[key] = (summary.byAcquisition[key] || 0) + numValue;
                }
                
                // 建築時期別
                if (dataset['@cat03']) {
                    const key = cat03Map[dataset['@cat03']] || dataset['@cat03'];
                    summary.byConstructionPeriod[key] = (summary.byConstructionPeriod[key] || 0) + numValue;
                }
                
                // 所在地別
                if (dataset['@cat04']) {
                    const key = cat04Map[dataset['@cat04']] || dataset['@cat04'];
                    summary.byLocation[key] = (summary.byLocation[key] || 0) + numValue;
                }
            }
        });
        
        // 結果を表示
        console.log('=== 集計結果 ===\n');
        console.log(`📊 総数: ${summary.total.toLocaleString('ja-JP')}戸\n`);
        
        console.log('🏠 建て方別:');
        Object.entries(summary.byBuildingType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, value]) => {
                const percentage = (value / summary.total * 100).toFixed(2);
                console.log(`   - ${key}: ${value.toLocaleString('ja-JP')}戸 (${percentage}%)`);
            });
        
        console.log('\n💰 取得方法別:');
        Object.entries(summary.byAcquisition)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([key, value]) => {
                const percentage = (value / summary.total * 100).toFixed(2);
                console.log(`   - ${key}: ${value.toLocaleString('ja-JP')}戸 (${percentage}%)`);
            });
        
        console.log('\n🏗️ 建築時期別:');
        Object.entries(summary.byConstructionPeriod)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([key, value]) => {
                const percentage = (value / summary.total * 100).toFixed(2);
                console.log(`   - ${key}: ${value.toLocaleString('ja-JP')}戸 (${percentage}%)`);
            });
        
        console.log('\n📍 所在地別（上位10件）:');
        Object.entries(summary.byLocation)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([key, value]) => {
                const percentage = (value / summary.total * 100).toFixed(2);
                console.log(`   - ${key}: ${value.toLocaleString('ja-JP')}戸 (${percentage}%)`);
            });
        
        // サンプルデータを表示
        console.log('\n\n=== サンプルデータ（最初の10件） ===\n');
        datasets.slice(0, 10).forEach((dataset, idx) => {
            const value = dataset.VALUE ? (typeof dataset.VALUE === 'object' ? dataset.VALUE.$ : dataset.VALUE) : '-';
            console.log(`データ${idx + 1}:`);
            console.log(`   - 値: ${value}`);
            if (dataset['@cat01']) console.log(`   - 建て方: ${cat01Map[dataset['@cat01']] || dataset['@cat01']}`);
            if (dataset['@cat02']) console.log(`   - 取得方法: ${cat02Map[dataset['@cat02']] || dataset['@cat02']}`);
            if (dataset['@cat03']) console.log(`   - 建築時期: ${cat03Map[dataset['@cat03']] || dataset['@cat03']}`);
            if (dataset['@cat04']) console.log(`   - 所在地: ${cat04Map[dataset['@cat04']] || dataset['@cat04']}`);
            console.log('');
        });
        
    } else {
        console.log('❌ データが見つかりません');
    }
}

main().catch(console.error);

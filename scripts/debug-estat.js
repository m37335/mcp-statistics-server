#!/usr/bin/env node

import { loadConfig } from '../dist/config.js';
import { EStatClient } from '../dist/sources/estat.js';
import axios from 'axios';

async function main() {
    const config = await loadConfig();
    const estatClient = new EStatClient({
        baseUrl: config.dataSources.estat.baseUrl,
        apiKey: config.dataSources.estat.apiKey,
    });
    
    console.log('e-Stat APIレスポンス構造を確認中...\n');
    
    try {
        const result = await estatClient.getStatsList({
            searchWord: '空き家',
            limit: 3,
        });
        
        console.log('取得結果:', JSON.stringify(result, null, 2));
        
        if (result.length > 0) {
            console.log('\n最初の要素の構造:');
            console.log(JSON.stringify(result[0], null, 2));
        }
    } catch (error) {
        console.error('エラー:', error.message);
        console.error(error.stack);
    }
}

main().catch(console.error);

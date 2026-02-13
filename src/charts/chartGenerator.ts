/**
 * チャート生成モジュール
 * SVG形式でチャートを生成します
 */

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
}

export interface AttributionInfo {
    sourceName: string;
    sourceUrl: string;
    license: string;
    additionalInfo?: string;
}

export interface ChartConfig {
    title?: string;
    xLabel?: string;
    yLabel?: string;
    width?: number;
    height?: number;
    showLegend?: boolean;
    colors?: string[];
    attribution?: AttributionInfo;
}

// プロフェッショナルな色パレット（参考画像の色味に基づく）
const DEFAULT_COLORS = [
    '#000000', // black - メインライン用
    '#22c55e', // bright green
    '#86efac', // light green
    '#eab308', // golden yellow
    '#ec4899', // soft pink/magenta
    '#06b6d4', // light blue/cyan
    '#6b7280', // medium grey
    '#d97706', // earthy orange/light brown
    '#f87171', // muted red/rose
    '#a78bfa', // lavender/purple
    '#d1d5db', // very light grey/silver
    '#3b82f6', // blue (追加)
    '#10b981', // green (追加)
    '#8b5cf6', // purple (追加)
];

/**
 * SVGチャートを生成
 */
export class ChartGenerator {
    private config: ChartConfig;

    constructor(config: ChartConfig = {}) {
        // 出典情報がある場合、高さを調整（出典表示用のスペースを確保）
        const baseHeight = config.height || 400;
        const adjustedHeight = config.attribution ? baseHeight + 50 : baseHeight;

        this.config = {
            width: config.width || 800,
            height: adjustedHeight,
            showLegend: config.showLegend !== false,
            colors: config.colors || DEFAULT_COLORS,
            attribution: config.attribution,
            title: config.title,
            xLabel: config.xLabel,
            yLabel: config.yLabel,
        };
    }

    /**
     * 折れ線グラフを生成
     */
    generateLineChart(series: ChartSeries[]): string {
        const { width, height } = this.config;
        
        // データに応じてパディングを調整
        const allLabels = this.getAllLabels(series);
        const maxValue = this.getMaxValue(series);
        const minValue = this.getMinValue(series);
        
        // Y軸の数値の幅に応じて左パディングを調整
        const yAxisLabelWidth = this.calculateYAxisLabelWidth(maxValue, minValue);
        const leftPadding = Math.max(80, yAxisLabelWidth + 20);
        
        // X軸の数値の高さに応じて下パディングを調整
        const xAxisLabelHeight = allLabels.length > 10 ? 100 : 80;
        // 出典情報がある場合、下部パディングを増やす
        const attributionHeight = this.config.attribution ? 60 : 0;
        const bottomPadding = xAxisLabelHeight + attributionHeight;
        
        // 凡例の位置に応じて右パディングを調整
        const legendWidth = this.calculateLegendWidth(series);
        const rightPadding = series.length > 3 ? Math.max(60, legendWidth + 20) : 60;
        
        const padding = { 
            top: 60, 
            right: rightPadding, 
            bottom: bottomPadding, 
            left: leftPadding 
        };
        
        const chartWidth = width! - padding.left - padding.right;
        const chartHeight = height! - padding.top - padding.bottom;
        const valueRange = maxValue - minValue || 1;

        let svg = this.createSVGHeader();
        svg += this.createBackground();
        svg += this.createTitle();
        svg += this.createAxes(padding, chartWidth, chartHeight);
        svg += this.createGridLines(padding, chartWidth, chartHeight, allLabels, maxValue, minValue);
        svg += this.createXAxisLabels(padding, chartWidth, chartHeight, allLabels);

        // データ系列を描画
        series.forEach((s, seriesIndex) => {
            const color = s.color || this.config.colors![seriesIndex % this.config.colors!.length];
            svg += this.createLinePath(s, allLabels, padding, chartWidth, chartHeight, maxValue, minValue, valueRange, color);
            svg += this.createDataPoints(s, allLabels, padding, chartWidth, chartHeight, maxValue, minValue, valueRange, color);
        });

        svg += this.createLegend(series, padding, chartWidth);
        svg += this.createAttribution();
        svg += '</svg>';

        return svg;
    }

    /**
     * 棒グラフを生成
     */
    generateBarChart(series: ChartSeries[]): string {
        const { width, height } = this.config;
        
        // データに応じてパディングを調整
        const allLabels = this.getAllLabels(series);
        const maxValue = this.getMaxValue(series);
        const minValue = Math.min(0, this.getMinValue(series));
        
        const yAxisLabelWidth = this.calculateYAxisLabelWidth(maxValue, minValue);
        const leftPadding = Math.max(80, yAxisLabelWidth + 20);
        const xAxisLabelHeight = allLabels.length > 10 ? 100 : 80;
        // 出典情報がある場合、下部パディングを増やす
        const attributionHeight = this.config.attribution ? 60 : 0;
        const bottomPadding = xAxisLabelHeight + attributionHeight;
        const legendWidth = this.calculateLegendWidth(series);
        const rightPadding = series.length > 3 ? Math.max(60, legendWidth + 20) : 60;
        
        const padding = { 
            top: 60, 
            right: rightPadding, 
            bottom: bottomPadding, 
            left: leftPadding 
        };
        
        const chartWidth = width! - padding.left - padding.right;
        const chartHeight = height! - padding.top - padding.bottom;
        const valueRange = maxValue - minValue || 1;

        const barWidth = chartWidth / (allLabels.length * (series.length + 1));
        const groupWidth = barWidth * series.length;

        let svg = this.createSVGHeader();
        svg += this.createBackground();
        svg += this.createTitle();
        svg += this.createAxes(padding, chartWidth, chartHeight);
        svg += this.createGridLines(padding, chartWidth, chartHeight, allLabels, maxValue, minValue);
        svg += this.createXAxisLabels(padding, chartWidth, chartHeight, allLabels);

        // 棒を描画
        allLabels.forEach((label, labelIndex) => {
            const x = padding.left + (labelIndex + 0.5) * (chartWidth / allLabels.length) - groupWidth / 2;

            series.forEach((s, seriesIndex) => {
                const dataPoint = s.data.find(d => d.label === label);
                if (dataPoint) {
                    const color = s.color || dataPoint.color || this.config.colors![seriesIndex % this.config.colors!.length];
                    const barHeight = ((dataPoint.value - minValue) / valueRange) * chartHeight;
                    const barX = x + seriesIndex * barWidth;
                    const barY = padding.top + chartHeight - barHeight;

                    svg += `<rect x="${barX}" y="${barY}" width="${barWidth * 0.8}" height="${barHeight}" fill="${color}" stroke="#fff" stroke-width="1" opacity="0.8"/>`;
                    svg += `<text x="${barX + barWidth * 0.4}" y="${barY - 5}" text-anchor="middle" font-size="10" fill="#666">${this.formatValue(dataPoint.value)}</text>`;
                }
            });
        });

        svg += this.createLegend(series, padding, chartWidth);
        svg += this.createAttribution();
        svg += '</svg>';

        return svg;
    }

    /**
     * 円グラフを生成
     */
    generatePieChart(data: ChartDataPoint[]): string {
        const { width, height } = this.config;
        
        // 出典情報がある場合、中心位置を上にシフト
        const attributionHeight = this.config.attribution ? 60 : 0;
        const centerX = width! / 2;
        const centerY = (height! - attributionHeight) / 2;
        const radius = Math.min(width!, height! - attributionHeight) / 2 - 80;

        const total = data.reduce((sum, d) => sum + d.value, 0);
        let currentAngle = -Math.PI / 2;

        let svg = this.createSVGHeader();
        svg += this.createBackground();
        svg += this.createTitle();

        // 円グラフのスライスを描画
        data.forEach((point, index) => {
            const color = point.color || this.config.colors![index % this.config.colors!.length];
            const angle = (point.value / total) * 2 * Math.PI;
            const endAngle = currentAngle + angle;

            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
            ].join(' ');

            svg += `<path d="${pathData}" fill="${color}" stroke="#fff" stroke-width="2" opacity="0.9"/>`;

            // ラベル
            const labelAngle = currentAngle + angle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + labelRadius * Math.cos(labelAngle);
            const labelY = centerY + labelRadius * Math.sin(labelAngle);

            svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">${point.label}</text>`;
            svg += `<text x="${labelX}" y="${labelY + 15}" text-anchor="middle" font-size="10" fill="#fff">${((point.value / total) * 100).toFixed(1)}%</text>`;

            currentAngle = endAngle;
        });

        // 凡例
        svg += '<g transform="translate(20, 60)">';
        data.forEach((point, index) => {
            const color = point.color || this.config.colors![index % this.config.colors!.length];
            const y = index * 25;
            svg += `<rect x="0" y="${y}" width="20" height="15" fill="${color}"/>`;
            svg += `<text x="30" y="${y + 12}" font-size="12" fill="#333">${point.label}: ${this.formatValue(point.value)}</text>`;
        });
        svg += '</g>';

        svg += this.createAttribution();
        svg += '</svg>';
        return svg;
    }

    // ヘルパーメソッド
    private createSVGHeader(): string {
        return `<svg width="${this.config.width}" height="${this.config.height}" xmlns="http://www.w3.org/2000/svg">`;
    }

    private createBackground(): string {
        return '<rect width="100%" height="100%" fill="#ffffff"/>';
    }

    private createTitle(): string {
        if (!this.config.title) return '';
        // より洗練されたタイトルスタイル（参考画像に基づく）
        return `<text x="${this.config.width! / 2}" y="28" text-anchor="middle" font-size="16" font-weight="600" font-family="system-ui, -apple-system, sans-serif" fill="#1f2937">${this.config.title}</text>`;
    }

    private createAxes(padding: { top: number; right: number; bottom: number; left: number }, chartWidth: number, chartHeight: number): string {
        let svg = '';
        // X軸（より洗練されたスタイル）
        svg += `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" stroke="#374151" stroke-width="1.5"/>`;
        // Y軸
        svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#374151" stroke-width="1.5"/>`;
        
        // 軸ラベル（より洗練されたフォントと色）
        if (this.config.xLabel) {
            svg += `<text x="${padding.left + chartWidth / 2}" y="${this.config.height! - 25}" text-anchor="middle" font-size="12" font-family="system-ui, -apple-system, sans-serif" fill="#6b7280">${this.config.xLabel}</text>`;
        }
        if (this.config.yLabel) {
            svg += `<text x="25" y="${padding.top + chartHeight / 2}" text-anchor="middle" font-size="12" font-family="system-ui, -apple-system, sans-serif" fill="#6b7280" transform="rotate(-90, 25, ${padding.top + chartHeight / 2})">${this.config.yLabel}</text>`;
        }
        
        return svg;
    }

    private createGridLines(padding: { top: number; bottom: number; left: number }, chartWidth: number, chartHeight: number, labels: string[], maxValue: number, minValue: number): string {
        let svg = '';
        const gridLines = 5;
        
        // 横のグリッド線（より洗練されたスタイル）
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            const value = maxValue - ((maxValue - minValue) / gridLines) * i;
            // より細く、控えめなグリッド線
            svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#f3f4f6" stroke-width="0.5"/>`;
            // Y軸の数値ラベル
            svg += `<text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" font-family="system-ui, -apple-system, sans-serif" fill="#6b7280">${this.formatValue(value)}</text>`;
        }
        
        // 縦のグリッド線（より控えめに）
        for (let i = 0; i <= labels.length; i++) {
            const x = padding.left + (chartWidth / (labels.length - 1 || 1)) * i;
            svg += `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + chartHeight}" stroke="#f3f4f6" stroke-width="0.5"/>`;
        }
        
        return svg;
    }

    /**
     * X軸の数値ラベルを生成
     */
    private createXAxisLabels(padding: { top: number; bottom: number; left: number }, chartWidth: number, chartHeight: number, labels: string[]): string {
        if (labels.length === 0) return '';
        
        let svg = '';
        const labelY = padding.top + chartHeight + 20;
        const fontSize = 10;
        
        // X軸の数値ラベルを表示
        labels.forEach((label, index) => {
            const x = padding.left + (index / (labels.length - 1 || 1)) * chartWidth;
            
            // ラベルが長い場合やデータポイントが多い場合は回転させる
            const avgLabelLength = labels.reduce((sum, l) => sum + l.length, 0) / labels.length;
            const shouldRotate = avgLabelLength > 6 || labels.length > 10;
            const rotation = shouldRotate ? -45 : 0;
            const offsetY = shouldRotate ? 15 : 0;
            const anchor = shouldRotate ? 'end' : 'middle';
            
            svg += `<text x="${x}" y="${labelY + offsetY}" text-anchor="${anchor}" font-size="${fontSize}" font-family="system-ui, -apple-system, sans-serif" fill="#6b7280" transform="rotate(${rotation} ${x} ${labelY + offsetY})">${label}</text>`;
        });
        
        return svg;
    }

    /**
     * Y軸ラベルの幅を計算
     */
    private calculateYAxisLabelWidth(maxValue: number, minValue: number): number {
        const gridLines = 5;
        let maxWidth = 0;
        
        for (let i = 0; i <= gridLines; i++) {
            const value = maxValue - ((maxValue - minValue) / gridLines) * i;
            const formatted = this.formatValue(value);
            // おおよその文字幅を計算（11px * 文字数）
            const width = formatted.length * 7;
            if (width > maxWidth) maxWidth = width;
        }
        
        return maxWidth;
    }

    /**
     * 凡例の幅を計算
     */
    private calculateLegendWidth(series: ChartSeries[]): number {
        let maxNameLength = 0;
        series.forEach(s => {
            if (s.name.length > maxNameLength) {
                maxNameLength = s.name.length;
            }
        });
        // 凡例の幅 = アイコン(16) + スペース(6) + テキスト(文字数 * 6.5)
        return 16 + 6 + (maxNameLength * 6.5);
    }

    private createLinePath(series: ChartSeries, labels: string[], padding: { top: number; left: number }, chartWidth: number, chartHeight: number, maxValue: number, minValue: number, valueRange: number, color: string): string {
        const points: string[] = [];
        
        labels.forEach((label, index) => {
            const dataPoint = series.data.find(d => d.label === label);
            if (dataPoint) {
                const x = padding.left + (index / (labels.length - 1 || 1)) * chartWidth;
                const y = padding.top + chartHeight - ((dataPoint.value - minValue) / valueRange) * chartHeight;
                points.push(`${x},${y}`);
            }
        });

        if (points.length === 0) return '';

        const pathData = `M ${points.join(' L ')}`;
        // より洗練されたラインスタイル（参考画像に基づく）
        return `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9"/>`;
    }

    private createDataPoints(series: ChartSeries, labels: string[], padding: { top: number; left: number }, chartWidth: number, chartHeight: number, maxValue: number, minValue: number, valueRange: number, color: string): string {
        let svg = '';
        
        labels.forEach((label, index) => {
            const dataPoint = series.data.find(d => d.label === label);
            if (dataPoint) {
                const x = padding.left + (index / (labels.length - 1 || 1)) * chartWidth;
                const y = padding.top + chartHeight - ((dataPoint.value - minValue) / valueRange) * chartHeight;
                // より洗練されたデータポイントスタイル
                svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="#ffffff" stroke-width="1.5" opacity="0.95"/>`;
            }
        });

        return svg;
    }

    private createLegend(series: ChartSeries[], padding: { top: number; right: number; bottom: number; left: number }, chartWidth: number): string {
        if (!this.config.showLegend || series.length === 0) return '';

        // データに応じて凡例の位置を決定
        // 系列数が多い場合や凡例が長い場合は下部に配置
        const legendWidth = this.calculateLegendWidth(series);
        // 系列数が5より大きい、または凡例の幅が180pxより大きい場合は下部に配置
        const shouldPlaceBottom = series.length > 5 || legendWidth > 180;
        
        let svg = '';
        
        if (shouldPlaceBottom) {
            // 下部に配置（横並び、複数行対応）
            const attributionHeight = this.config.attribution ? 60 : 0;
            const legendY = this.config.height! - attributionHeight - 60;
            const startX = padding.left;
            const itemSpacing = 25;
            const rowHeight = 20;
            let currentX = startX;
            let currentY = 0;
            const maxWidth = chartWidth;
            
            svg = `<g id="legend" transform="translate(${startX}, ${legendY})">`;
            series.forEach((s, index) => {
                const color = s.color || this.config.colors![index % this.config.colors!.length];
                const itemWidth = 16 + 6 + (s.name.length * 7);
                
                // 右端を超える場合は次の行へ
                if (currentX + itemWidth > startX + maxWidth && index > 0) {
                    currentX = 0;
                    currentY += rowHeight;
                }
                
                svg += `<rect x="${currentX}" y="${currentY}" width="16" height="12" fill="${color}" rx="2"/>`;
                svg += `<text x="${currentX + 22}" y="${currentY + 9}" font-size="11" font-family="system-ui, -apple-system, sans-serif" fill="#374151">${s.name}</text>`;
                
                currentX += itemWidth + itemSpacing;
            });
            svg += '</g>';
        } else {
            // 右上に配置（縦並び）
            const attributionHeight = this.config.attribution ? 60 : 0;
            const legendY = padding.top;
            const legendX = this.config.width! - legendWidth - 20;
            
            svg = `<g transform="translate(${legendX}, ${legendY})">`;
            series.forEach((s, index) => {
                const color = s.color || this.config.colors![index % this.config.colors!.length];
                const y = index * 20;
                svg += `<rect x="0" y="${y}" width="16" height="12" fill="${color}" rx="2"/>`;
                svg += `<text x="22" y="${y + 9}" font-size="11" font-family="system-ui, -apple-system, sans-serif" fill="#374151">${s.name}</text>`;
            });
            svg += '</g>';
        }

        return svg;
    }

    /**
     * 出典情報を生成
     */
    private createAttribution(): string {
        if (!this.config.attribution) return '';

        const attr = this.config.attribution;
        const { width, height } = this.config;
        const fontSize = 9;
        const lineHeight = 13;
        const padding = 10;
        const attributionHeight = 50; // 出典情報の高さ
        const startY = height! - attributionHeight + padding;

        let svg = '<g id="attribution">';
        
        // 背景（より控えめに）
        svg += `<rect x="0" y="${startY - padding}" width="${width}" height="${attributionHeight}" fill="#ffffff" opacity="0.95"/>`;
        
        // 区切り線（より洗練されたスタイル）
        svg += `<line x1="0" y1="${startY - padding}" x2="${width}" y2="${startY - padding}" stroke="#e5e7eb" stroke-width="0.5"/>`;
        
        // 出典情報
        let currentY = startY;
        
        // データソース名（より洗練されたフォント）
        svg += `<text x="${padding}" y="${currentY}" font-size="${fontSize + 1}" font-weight="500" font-family="system-ui, -apple-system, sans-serif" fill="#374151">出典: ${attr.sourceName}</text>`;
        currentY += lineHeight;
        
        // 追加情報（指標コードなど）
        if (attr.additionalInfo) {
            svg += `<text x="${padding}" y="${currentY}" font-size="${fontSize}" font-family="system-ui, -apple-system, sans-serif" fill="#6b7280">${attr.additionalInfo}</text>`;
            currentY += lineHeight;
        }
        
        // ライセンスとURL
        const licenseText = `ライセンス: ${attr.license}`;
        const urlText = attr.sourceUrl;
        svg += `<text x="${padding}" y="${currentY}" font-size="${fontSize}" font-family="system-ui, -apple-system, sans-serif" fill="#6b7280">${licenseText} | ${urlText}</text>`;
        
        svg += '</g>';

        return svg;
    }

    private getAllLabels(series: ChartSeries[]): string[] {
        const labels = new Set<string>();
        series.forEach(s => {
            s.data.forEach(d => labels.add(d.label));
        });
        return Array.from(labels).sort();
    }

    private getMaxValue(series: ChartSeries[]): number {
        let max = -Infinity;
        series.forEach(s => {
            s.data.forEach(d => {
                if (d.value > max) max = d.value;
            });
        });
        return max === -Infinity ? 0 : max;
    }

    private getMinValue(series: ChartSeries[]): number {
        let min = Infinity;
        series.forEach(s => {
            s.data.forEach(d => {
                if (d.value < min) min = d.value;
            });
        });
        return min === Infinity ? 0 : min;
    }

    private formatValue(value: number): string {
        if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
        if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
        return value.toFixed(2);
    }
}

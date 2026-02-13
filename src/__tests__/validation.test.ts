import {
    validateEStatSearchStatsArgs,
    validateEStatGetDataArgs,
    validateWorldBankGetIndicatorArgs,
    validateWorldBankSearchIndicatorsArgs,
    validateOECDGetDataArgs,
    validateEurostatGetDataArgs,
    ValidationError,
} from '../validation.js';

describe('Validation', () => {
    describe('validateEStatSearchStatsArgs', () => {
        it('should validate valid args', () => {
            const result = validateEStatSearchStatsArgs({
                searchWord: '人口',
                limit: 10,
            });
            expect(result.searchWord).toBe('人口');
            expect(result.limit).toBe(10);
        });

        it('should validate args without optional fields', () => {
            const result = validateEStatSearchStatsArgs({});
            expect(result).toEqual({});
        });

        it('should throw error for invalid limit', () => {
            expect(() => {
                validateEStatSearchStatsArgs({ limit: 0 });
            }).toThrow(ValidationError);

            expect(() => {
                validateEStatSearchStatsArgs({ limit: 1001 });
            }).toThrow(ValidationError);
        });

        it('should throw error for invalid type', () => {
            expect(() => {
                validateEStatSearchStatsArgs(null);
            }).toThrow(ValidationError);
        });
    });

    describe('validateEStatGetDataArgs', () => {
        it('should validate valid args', () => {
            const result = validateEStatGetDataArgs({
                statsDataId: '0000010101',
                limit: 100,
            });
            expect(result.statsDataId).toBe('0000010101');
            expect(result.limit).toBe(100);
        });

        it('should throw error for missing statsDataId', () => {
            expect(() => {
                validateEStatGetDataArgs({});
            }).toThrow(ValidationError);
        });

        it('should throw error for empty statsDataId', () => {
            expect(() => {
                validateEStatGetDataArgs({ statsDataId: '' });
            }).toThrow(ValidationError);
        });
    });

    describe('validateWorldBankGetIndicatorArgs', () => {
        it('should validate valid args', () => {
            const result = validateWorldBankGetIndicatorArgs({
                countryCode: 'JP',
                indicatorCode: 'NY.GDP.MKTP.CD',
                startYear: 2020,
                endYear: 2023,
            });
            expect(result.countryCode).toBe('JP');
            expect(result.indicatorCode).toBe('NY.GDP.MKTP.CD');
            expect(result.startYear).toBe(2020);
            expect(result.endYear).toBe(2023);
        });

        it('should throw error for missing required fields', () => {
            expect(() => {
                validateWorldBankGetIndicatorArgs({});
            }).toThrow(ValidationError);
        });

        it('should throw error when startYear > endYear', () => {
            expect(() => {
                validateWorldBankGetIndicatorArgs({
                    countryCode: 'JP',
                    indicatorCode: 'NY.GDP.MKTP.CD',
                    startYear: 2023,
                    endYear: 2020,
                });
            }).toThrow(ValidationError);
        });
    });

    describe('validateOECDGetDataArgs', () => {
        it('should validate valid args', () => {
            const result = validateOECDGetDataArgs({
                datasetId: 'QNA',
                filter: 'JPN.GDP.....',
            });
            expect(result.datasetId).toBe('QNA');
            expect(result.filter).toBe('JPN.GDP.....');
        });

        it('should throw error for missing datasetId', () => {
            expect(() => {
                validateOECDGetDataArgs({});
            }).toThrow(ValidationError);
        });
    });

    describe('validateEurostatGetDataArgs', () => {
        it('should validate valid args', () => {
            const result = validateEurostatGetDataArgs({
                datasetCode: 'nama_10_gdp',
                lang: 'EN',
            });
            expect(result.datasetCode).toBe('nama_10_gdp');
            expect(result.lang).toBe('EN');
        });

        it('should throw error for invalid lang', () => {
            expect(() => {
                validateEurostatGetDataArgs({
                    datasetCode: 'nama_10_gdp',
                    lang: 'XX',
                });
            }).toThrow(ValidationError);
        });
    });
});

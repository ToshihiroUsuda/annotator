import { RJSFSchema } from '@rjsf/utils'

export const metaInfoFormSchema: RJSFSchema = {
    type: 'object',
    properties: {
        exclusion: {
            title: 'Exclusion',
            type: 'boolean',
            default: false,
        },
    },
    dependencies: {
        exclusion: {
            oneOf: [
                {
                    properties: {
                        exclusion: {
                            enum: [true],
                        },
                        exclusionReason: {
                            title: 'Reason',
                            type: 'string',
                        },
                    },
                },
                {
                    properties: {
                        exclusion: {
                            enum: [false],
                        },
                        examDateTime: {
                            title: 'Examination Date & Time',
                            type: 'string',
                            format: 'date-time',
                        },
                        informedConsent: {
                            title: 'Informed Consent',
                            type: 'string',
                            enum: [
                                'Not Acquired',
                                'New Acquisition',
                                'Previously Acquired',
                            ],
                        },
                        scopeType: {
                            title: 'Scope Type',
                            type: 'string',
                            enum: ['580UT', '740UT', 'Unclear'],
                        },
                        noLesions: {
                            title: 'No Lesions',
                            type: 'boolean',
                            default: false,
                        },
                    },
                    required: [
                        'informedConsent',
                        'pathologicalResult',
                        'scopeType',
                    ],
                },
            ],
        },
    },
}

export const metaInfoUIShema = {}

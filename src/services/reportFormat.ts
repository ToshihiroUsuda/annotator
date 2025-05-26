interface IFormat {
    header: string
    type: string
}

export const exportSummeryReportFormat: {
    [key: string]: IFormat | { [key: string]: IFormat }
} = {
    phase: {
        header: 'Phase',
        type: 'string',
    },
    examDateTime: {
        header: 'Date Time',
        type: 'dateTime',
    },
    informedConsent: {
        header: 'Informed Consent',
        type: 'string',
    },
    scopeType: {
        header: 'Scope Type',
        type: 'string',
    },
    noLesions: {
        header: 'No Lesions',
        type: 'boolean',
    },
    exclusion: {
        header: 'Exclusion',
        type: 'boolean',
    },
    exclusionReason: {
        header: 'Exclusion Reason',
        type: 'string',
    },
}

export const exportPatientReportFormat: {
    [key: string]: IFormat | { [key: string]: IFormat }
} = {
    patientInfo: {
        age: {
            header: 'Age',
            type: 'string',
        },
        sex: {
            header: 'Sex',
            type: 'string',
        },
        anamnesis: {
            header: 'Anamnesis',
            type: 'string',
        },
        surgicalHistory: {
            header: 'Surgical History',
            type: 'string',
        },
        remarks: {
            header: 'Remarks',
            type: 'string',
        },
    },
    examInfo: {
        parpose: {
            header: 'Parpose',
            type: 'string',
        },
        transgastricApproach: {
            header: 'Transgastic Approach',
            type: 'string',
        },
        remarks: {
            header: 'Remarks',
            type: 'string',
        },
    },
    pancreasInfo: {
        condition: {
            header: 'Pancreas Condition',
            type: 'string',
        },
        pancreaticParenchyma: {
            header: 'CP: Pancreatic Parenchyma',
            type: 'array',
        },
        pancreaticDuct: {
            header: 'CP: Pancreatic Duct',
            type: 'array',
        },
        others: {
            header: 'CP: Others',
            type: 'array',
        },
    },
}

export const exportLesionsReportFormat: {
    [key: string]: IFormat | { [key: string]: IFormat }
} = {
    imageDiagnosis: {
        bodyRegion: {
            header: 'Body Region',
            type: 'string',
        },
        lesionType: {
            header: 'Image Diagnosis',
            type: 'string',
        },
    },
    pathologicalResult: {
        header: 'Pathological Result',
        type: 'string',
    },
    detail: {
        header: 'Detail',
        type: 'string',
    },
    remarks: {
        header: 'Remarks',
        type: 'string',
    },
}

export const exportPrivateReportFormat: { [key: string]: IFormat } = {
    examDateTime: {
        header: 'Date Time',
        type: 'dateTime',
    },
    informedConsent: {
        header: 'Informed Consent',
        type: 'string',
    },
    exclusion: {
        header: 'Exclusion',
        type: 'boolean',
    },
    exclusionReason: {
        header: 'Exclusion Reason',
        type: 'string',
    },
}

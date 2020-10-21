export interface Cve {
    Modified:                         Date;
    Published:                        Date;
    access:                           Access;
    assigner:                         string;
    cvss:                             number;
    "cvss-time":                      Date;
    "cvss-vector":                    string;
    cwe:                              string;
    id:                               string;
    impact:                           Impact;
    "last-modified":                  Date;
    references:                       string[];
    summary:                          string;
    entities:                        Entity[];
}

export interface Entity {
    mentions: {
        text: {
            content: string
        },
        type: string;
    }[];
    metadata: {};
    name: string;
    salience: number;
    type: string;
}

export interface Access {
    authentication: string;
    complexity:     string;
    vector:         string;
}

export interface Impact {
    availability:    string;
    confidentiality: string;
    integrity:       string;
}

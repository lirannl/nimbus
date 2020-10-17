import { google } from "@google-cloud/language/build/protos/protos";

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
    vulnerable_configuration:         string[];
    vulnerable_configuration_cpe_2_2: any[];
    vulnerable_product:               string[];
    entities?: google.cloud.language.v1.IEntity[];
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

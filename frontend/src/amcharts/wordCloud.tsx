import '../App.css';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Cve } from '../interfaces/cve_interface';

am4core.useTheme(am4themes_animated);

function setWordCloud() {
    const wordCloud = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
    wordCloud.fontFamily = "Courier New";
    const keywordSeries: am4plugins_wordCloud.WordCloudSeries = wordCloud.series.push(new am4plugins_wordCloud.WordCloudSeries() as any);
    keywordSeries.minFontSize = 0.5;
    keywordSeries.randomness = 0.6;
    keywordSeries.rotationThreshold = 0.0;
    keywordSeries.dataFields.word = "cveTag";
    keywordSeries.dataFields.value = "avgSeverity";
    keywordSeries.heatRules.push({
        target: keywordSeries.labels.template,
        property: "fill",
        min: am4core.color("#0000CC"),
        max: am4core.color("#CC00CC"),
        dataField: "value"
    });
    
    keywordSeries.labels.template.url = `https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword={word}`;
    keywordSeries.labels.template.urlTarget = "_blank";
    keywordSeries.labels.template.tooltipText = "Avg Severity: {value}";
    const hoverState = keywordSeries.labels.template.states.create("hover");
    hoverState.properties.fill = am4core.color("#FF0000");
    return keywordSeries;
}


export interface keywordMap {
    [keyword: string]: {
       count: number,
       severity: number[],
       cveList: string[]
    }
}
/**
 * Count & map entities to a dictionary 
 * @param data Original data from API
 */
function getCommonWords(data: Cve[]) {
    let keywordMap: keywordMap = {};

    data.forEach(
        (cve_interface) => {
            let entityPerCVECount = 0;
            // For each entity in the cve data
            return cve_interface.entities.forEach((entity) => {
                if (entityPerCVECount < 3) {
                    if (entity.type !== "NUMBER") {
                        entityPerCVECount++;
                        if (keywordMap[entity.name]) {
                            keywordMap[entity.name].severity.push(cve_interface.cvss);
                            keywordMap[entity.name].cveList.push(cve_interface.id);
                            keywordMap[entity.name].count++;
                        } else {
                            keywordMap[entity.name] = {
                                count: 1,
                                severity: [cve_interface.cvss],
                                cveList: [cve_interface.id]
                            };
                        }
                    }
                }
            });
    })
    return keywordMap;
}

/**
 * Sort object by average severity of keywords
 */
function sortKeywords(keywordMap: keywordMap) {
    const unsorted = Object.keys(keywordMap).map(function (key: string) {
        const sum = keywordMap[key].severity.reduce((a, b) => a + b, 0);
        const avg = (sum / keywordMap[key].severity.length) || 0;
        return { name: key, total: keywordMap[key].count, avgSeverity: avg, cveList: keywordMap[key].cveList }
    });
    return unsorted.sort(function (a, b) { return b.avgSeverity - a.avgSeverity });
}

/**
 * Build the keyword word cloud
 * @param data The CVE data to build the world cloud from
 * @returns top keywords in am4plugins_wordCloud.WordCloud form
 */
export function makeChart(data: Cve[])  {
    const keywordSeries = setWordCloud();
    const words: {cveTag: string, avgSeverity: number}[] = [];
    const keywordMap = getCommonWords(data);
    const sortedKeywords = sortKeywords(keywordMap);
    sortedKeywords.forEach(function (value) {
        words.push({
            cveTag: value.name, 
            avgSeverity: value.avgSeverity
        })
      }); 
    keywordSeries.data = words.slice(0,100);
    return keywordSeries;
}
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export interface score_correlation {
    [severityRating: string]: number;
}

/**
 * Associate CVE data with specific dates
 * @param keywordData original processed data for the given keyword
 */
function correlateSeverity(keywordData: any) {
    let data: score_correlation = { };
    Object.keys(keywordData.cves).map((cve: string, index) => {
        const severityRating = getScoreRating(keywordData.cves[cve].severity);
        if (data.hasOwnProperty(severityRating)) data[severityRating]++;
        else data[severityRating] = 1;
        return cve;
    });
    return data;
}

/**
 * Find the CVSS score rating (low, medium, high)
 * @param severity CVSS score of CVE
 */
function getScoreRating(severity: number) {
    if (severity > 0.0 && severity <= 3.9) return "Low";
    else if (severity >= 4.0 && severity <= 6.9) return "Medium";
    else if (severity >= 7.0 && severity <= 8.9) return "High";
    else return "Critical";
}

/**
 * Process keyword data to amchart's format
 * @param correlated_dates Object of dates with CVE data
 */
function generateChartData(keywordData: any) {
    const data = correlateSeverity(keywordData);
    return Object.keys(data).map((item,index) => {
        console.log(item)
        return {
            severity: item,
            numberOfCVEs: data[item]
        };
    })
}

/**
 * Create the amchart instance
 */
export function buildPieChart(keywordData: any) {
    let chart = am4core.create("pieChart", am4charts.PieChart);
    chart.data = generateChartData(keywordData);
    let pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "numberOfCVEs";
    pieSeries.dataFields.category = "severity";
    pieSeries.slices.template.stroke = am4core.color("#fff");
    pieSeries.slices.template.strokeOpacity = 1;
    pieSeries.hiddenState.properties.opacity = 1;
    pieSeries.hiddenState.properties.endAngle = -90;
    pieSeries.hiddenState.properties.startAngle = -90;
    chart.hiddenState.properties.radius = am4core.percent(0);
}

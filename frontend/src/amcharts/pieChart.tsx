import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export interface score_correlation {
    [severityRating: string]: number;
}

const color_lookup: {[severity: string]: string} = {
    "Critical": "#DB404D",
    "High": "#F89900",
    "Medium": "#F9CA00",
    "Low": "#35B147"
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
            numberOfCVEs: data[item],
            color: color_lookup[item]
        };
    })
}

/**
 * Create the amchart instance
 */
export function buildPieChart(keywordData: any) {
    let chart = am4core.create("pieChart", am4charts.PieChart);
    chart.data = generateChartData(keywordData);
    console.log(chart.data)
    chart.hiddenState.properties.radius = am4core.percent(0);
    chart.innerRadius = am4core.percent(30);
    chart.legend = new am4charts.Legend();
    chart.legend.labels.template.fill = am4core.color("#AFB5D3");
    chart.legend.valueLabels.template.text = "{category.value}";
    // chart.legend.valueLabels.template.fontFamily =  "Courier New";
    chart.legend.valueLabels.template.width = 10;
    chart.legend.maxWidth = undefined!;
    chart.legend.fontSize = 20;

    let pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "numberOfCVEs";
    pieSeries.dataFields.category = "severity";
    pieSeries.slices.template.stroke = am4core.color("#fff");
    pieSeries.slices.template.strokeOpacity = 1;
    pieSeries.hiddenState.properties.opacity = 1;
    pieSeries.hiddenState.properties.endAngle = -90;
    pieSeries.hiddenState.properties.startAngle = -90;

    pieSeries.alignLabels = false;
    pieSeries.labels.template.radius = am4core.percent(-40);
    pieSeries.labels.template.fill = am4core.color("black");
    pieSeries.labels.template.text = "{value.percent.formatNumber('#.0')}%";
    pieSeries.labels.template.fontSize = 15;
    // pieSeries.labels.template.padding(0,0,0,0);
    pieSeries.slices.template.propertyFields.fill = "color";
    pieSeries.slices.template.propertyFields.stroke = "color";

    pieSeries.ticks.template.disabled = true;
    pieSeries!.tooltip!.disabled = true;
}

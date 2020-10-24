import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export interface date_correlation {
    [date: string]: {
        CVECount: number;
        AvgSeverity: number[];
    }
}

/**
 * Add a new series of data to the chart instance
 * @param chart chart to add series to
 * @param field element within chart to add
 * @param name name to call the series
 * @param opposite 
 */
function addSeries(chart: am4charts.XYChart, field: string, name: string, opposite: boolean) {
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis() as any);
    if (chart.yAxes.indexOf(valueAxis) !== 0)  valueAxis.syncWithAxis = chart.yAxes.getIndex(0);
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = field;
    series.dataFields.dateX = "date";
    series.strokeWidth = 2;
    // series.yAxis = valueAxis; // this adds another Y axis - looks weird
    series.name = name;
    series.tooltipText = "{name}: [bold]{valueY}[/]";
    series.tensionX = 1;
    series.tensionY = 1;
    series.showOnInit = true;
    let interfaceColors = new am4core.InterfaceColorSet();
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.stroke = interfaceColors.getFor("background");
    bullet.circle.strokeWidth = 2;
    valueAxis.renderer.line.strokeOpacity = 1;
    valueAxis.renderer.line.strokeWidth = 2;
    valueAxis.renderer.line.stroke = series.stroke;
    valueAxis.renderer.labels.template.fill = series.stroke;
    valueAxis.renderer.opposite = opposite; 
    series.xAxis.renderer.labels.template.wrap = true;
    series.xAxis.renderer.labels.template.maxWidth = 80;
    series.xAxis.renderer.labels.template.fontSize = 10;
}  

/**
 * Associate CVE data with specific dates
 * @param keywordData original processed data for the given keyword
 */
function correlateDates(keywordData: any) {
    let data: date_correlation = { };
    Object.keys(keywordData.cves).map((cve: string, index) => {
        const dateFix = new Date(keywordData.cves[cve].Published)
        dateFix.setHours(0, 0, 0, 0);
        if (data[dateFix.toDateString()]) {
            // date is already in object
            data[dateFix.toDateString()]["AvgSeverity"].push(keywordData.cves[cve].severity);
            data[dateFix.toDateString()]["CVECount"]++;
        } else {
            // date is not in object yet, so initialise it
            data[dateFix.toDateString()] = {
                "CVECount": 1,
                "AvgSeverity": [keywordData.cves[cve].severity],
            };
        }
        return cve;
    });
    return data;
}

/**
 * Process correlated date data to amchart's format
 * @param correlated_dates Object of dates with CVE data
 */
function generateChartData(correlated_dates: date_correlation) {
    return Object.keys(correlated_dates).map((day,index) => {
        let publishDate = new Date(day);
        publishDate = new Date(publishDate.toDateString())
        publishDate.setHours(0, 0, 0, 0);
        const sum = correlated_dates[day].AvgSeverity.reduce((a, b) => a + b, 0);
        const avg = (sum / correlated_dates[day].AvgSeverity.length) || 0;
        return {
            date: publishDate,
            CVECount: correlated_dates[day].CVECount,
            AvgSeverity: avg 
        };
    })
}

/**
 * Build the line chart
 * @param correlated_dates Object of dates with CVE data
 */
export function buildLineChart(keywordData:any) {
    console.debug(keywordData);
    let chart = am4core.create("lineGraph", am4charts.XYChart);
    chart.colors.step = 2;
    chart.data = generateChartData(correlateDates(keywordData));
    console.log(correlateDates(keywordData));
    console.log(chart.data);
    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.minGridDistance = 50;
    addSeries(chart, "CVECount", "CVECount", false);
    addSeries(chart, "AvgSeverity", "AvgSeverity", true);
    chart.legend = new am4charts.Legend();
    chart.cursor = new am4charts.XYCursor();
    // chart.fontSize = 5;
}

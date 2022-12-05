import Chart from "./chart.js";

class bar extends Chart {
  constructor(id, data, width, height) {
    super(id, data, width, height);
    this.x_field = "sector";
    this.y_field = "Close";
    super.add_svg();
    super.update_chart();
    this.svg
      .append("text")
      .attr("x", 270)
      .attr("y", 30)
      .attr("font-size", 20)
      .text("Average Close Price by Industry in USA")
      .attr("text-anchor", "middle");
  }

  add_scale() {
    let x_domain = this.BarData.map((d) => d[0]);
    let y_domain = d3.max(this.BarData, (d) => +d[1]) * 1.2;
    this.x = d3
      .scaleBand()
      .domain(x_domain)
      .range([0, this.innerW])
      .padding(0.2);
    this.y = d3.scaleLinear().domain([0, y_domain]).range([this.innerH, 0]);
  }
  update_data() {
    this.BarData = d3.rollups(
      this.data,
      (d) => d3.mean(d, (v) => +v[this.y_field]),
      (d) => d[this.x_field]
    );
    this.BarData.sort((a, b) => (a[1] > b[1] ? -1 : 1));
  }

  draw_chart() {
    this.ChartArea.selectAll("rect")
      .data(this.BarData)
      .join("rect")
      .attr("class", (d) => d[0]) //设置一个类名,方便后续调用
      .attr("x", (d) => this.x(d[0]))
      .attr("y", (d) => this.y(d[1]))
      .attr("width", this.x.bandwidth())
      .attr("height", (d) => this.innerH - this.y(d[1]))
      .attr("stroke", "black")
      .attr("stroke-width", "0.25")
      .attr("fill", "royalblue");
  }
}

class line extends Chart {
  constructor(id, data, originData) {
    super(id, data);
    this.origin_data = originData;
    this.x_field = "From";
    this.y_field = "To";
    super.add_svg();
    super.update_chart();

    this.svg
      .append("text")
      .attr("x", 370)
      .attr("y", 30)
      .attr("font-size", 20)
      .text("Trend of Average Close Price by Industry and day in USA")
      .attr("text-anchor", "middle");

    this.add_legend();
  }

  add_scale() {
    this.x = d3
      .scaleBand()
      .domain([...new Set(this.data.map((d) => d[1]))])
      .range([0, this.innerW]);
    this.y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => d[2]) * 1.2])
      .range([this.innerH, 0]);
    let industries = [...new Set(this.data.map((d) => d[0]))];
    this.color = d3.scaleOrdinal(d3.schemeTableau10).domain(industries);
    this.industries = industries;
  }
  update_data() {}

  draw_chart() {
    let industries = [...new Set(this.data.map((d) => d[0]))];
    let line = d3
      .line()
      .x((d) => this.x(d[1]))
      .y((d) => this.y(d[2]));
    industries.forEach((d) => { 
      let data = this.data.filter((v) => v[0] === d);

      this.ChartArea.append("path")
        .datum(data)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", ( ) => this.color(d));

      // this.ChartArea.selectAll("mytext")
      //   .data([0])
      //   .join("text")
      //   .attr("x", (d) => this.x(data[data.length - 1][1]))
      //   .attr("y", (d) => this.y(data[data.length - 1][2]))
      //   .text(d);
    });
  }

  add_legend() {
    let g = this.svg
      .append("g")
      .attr("transform", `translate(${this.width - 200},0)`);
    g.append("text")
      .text("Industry")
      .attr("x", 20)
      .attr("y", 20)
      .attr("fill", "gray");

    g.selectAll("rect")
      .data(this.industries)
      .join("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("x", 20)
      .attr("y", (d, i) => 30 + i * 25)
      .attr("fill", (d) => this.color(d));
    g.selectAll("mytext")
      .data(this.industries)
      .join("text")
      .attr("x", 45)
      .attr("y", (d, i) => 30 + i * 25 + 15)
      .text((d) => d)
      .attr("fill", "gray");
  }
}

async function getdata() {
  let data = await d3.csv("./Predictoin_Visualization.csv");
  data = data.filter((d) => d.country === "United States");
  new bar("viz", data);
  let convert_data = get_conver_data(data);

  new line("viz1", convert_data, data);
  let industry = [...new Set(data.map((d) => d.sector))];
  set_selects(industry, data);
}

function get_conver_data(data) {
  let convert_data = [];
  d3.range(60).forEach((d) => {
    data.map((v) => {
      convert_data.push({
        day: d,
        industry: v.sector,
        price: +v[d],
      });
    });
  });
  convert_data = d3.flatRollup(
    convert_data,
    (d) => d3.mean(d, (v) => v.price),
    (d) => d.industry,
    (d) => d.day
  );
  console.log("conv==>", convert_data);

  return convert_data;
}
function set_selects(companies, data) {
  // this.draw_chart();

  let filters = {};
  add_select({
    div: d3.select("#toSelect"),
    options: companies,
    classname: "company",
    changeEvent,
  });

  function changeEvent(e, d) {
    let filter_value = { [this.className]: e.target.value };

    let values = Array.from(this.options)
      .filter(function (option) {
        return option.selected;
      }) // filter for selected values
      .map(function (option) {
        return option.value;
      }); // return a new

    let chart_data = data.filter((d) => values.includes(d.sector));
    let convert_data = get_conver_data(chart_data);
    new line("viz1", convert_data, data);
  }

  function add_select({ div, options, classname, changeEvent }) {
    // options.unshift("All");
    // label
    div
      .selectAll(`.labelclassname`)
      .data([0])
      .join("label")
      .attr("class", "label" + classname)
      .html(classname);
    // add select
    let select = div
      .selectAll(`.classname`)
      .data([0])
      .join("select")
      .attr("class", classname)
      .property("multiple", true);
    // opotions
    let option = select
      .selectAll("option")
      .data(options)
      .join("option")
      .attr("value", (d) => d)
      .html((d) => d);

    select.on("change", changeEvent);
  }
}
getdata();

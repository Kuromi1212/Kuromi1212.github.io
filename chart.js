export default class ParentChart {
  constructor(id, data) {
    this.data = data;
    this.div = id;
  }

  add_svg() {
    this.add_margin();
    this.add_chart_area();
  }

  add_margin() {
    const div = d3.select(`#${this.div}`);
    div.selectAll("*").remove();
    this.getWH(div);
    this.margin = { left: 140, right: 150, top: 50, bottom: 50 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;
    this.svg = div
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
    // .attr('viewBox',`0 0 ${this.view_width} ${this.view_height}`)
    // .attr('preserveAspectRatio','xMidYMid meet')
    // 绘制zoom的显示区域,给g的属性.attr('clip-path', 'url(#clipper)')
    this.svg
      .append("clipPath")
      .attr("id", "clipper")
      .append("rect")
      .attr("x", 0)
      .attr("y", this.margin.top)
      .attr("width", this.innerW)
      .attr("height", this.innerH);
  }

  add_chart_area() {
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    this.draw_area = this.ChartArea.append("g");
    this.AxisYLeft = this.ChartArea.append("g");
    this.AxisYRight = this.ChartArea.append("g").attr(
      "transform",
      `translate(${this.innerW},0)`
    );
    this.AxisX = this.ChartArea.append("g").attr(
      "transform",
      `translate(0,${this.innerH})`
    );
  }
  add_label() {
    this.ChartArea.selectAll(".x_label")
      .data([0])
      .join("text")
      .attr("class", "x_label")
      .attr("transform", `translate(${this.innerW / 2},${this.innerH + 30})`)
      .text(this.x_field);
    // y1
    this.ChartArea.selectAll(".y_label")
      .data([0])
      .join("text")
      .attr("class", "y_label")
      .attr("transform", `translate(,) rotate(90)`)
      .text(this.y_field);
  }

  add_axis() {
    this.x && this.AxisX.transition().delay(200).call(d3.axisBottom(this.x));
    this.y && this.AxisYLeft.transition().delay(200).call(d3.axisLeft(this.y));
  }

  tips_show(e, v, html) {
    d3.select(".d3-tip")
      .style("display", "block")
      .style("position", "absolute")
      .style("top", e.pageY + "px")
      .style("left", e.pageX + "px")
      .style("padding", "5px")
      .html(html);
  }
  tips_hide() {
    d3.select(".d3-tip").style("display", "none");
  }
  update_chart() {
    this.update_data();
    this.add_scale();
    this.add_axis();
    this.draw_chart();
  }

  getWH(node) {
    this.width = node.node().getBoundingClientRect().width * 0.9;
    this.height = node.node().getBoundingClientRect().height * 0.9;
  }

  setZoom() {
    let x = this.x;
    const zoomed = (e) => {
      console.log(e);
      let t = e.transform;
      // 重新设置xscale
      this.x = t.rescaleX(x);
      this.AxisX.call(d3.axisBottom(this.x));
      // 下面画图
    };

    let extent = [
      [this.margin.left, this.margin.top],
      [this.innerW, this.innerH],
    ];
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .extent(extent)
      .translateExtent(extent);
    this.svg.call(this.zoom);
    this.zoom.on("zoom", zoomed);
  }
}

d3.csv("census.csv").then(drawData);

var g;
var svg;
var data;

const canvasWidth=800;
const canvasHeight=600;
const edgePadding = 50;
const barPer = 0.618;

const maxPop=36756666;

var yScaler = d3.scaleLinear().domain([0,maxPop]).range([0,canvasHeight-edgePadding]);
var colorScaler = d3.scaleLinear().domain([1,7]).range(['Orangered','Silver']);


function drawData(csvLines){
    
    data = csvLines;
    segmentWidth = (canvasWidth-edgePadding)/data.length;
    barWidth = segmentWidth*barPer;
    interval = segmentWidth*(1-barPer);
    svg = d3.select("svg");
    svg.attr("width",canvasWidth+10)
        .attr("height",canvasHeight)
    g = svg.selectAll("*").data(data).enter().append("g");
    for (let index in data.columns){
        if (index == 0) continue;
        g.append("rect")
        .attr("x",function(d,i){
            return segmentWidth*i+interval+edgePadding;
        })
        .attr("y",function(d){
            var accHeight=0;
            for(let i =1;i<=index;i++) accHeight+=yScaler(d[data.columns[i]]);
            return canvasHeight-edgePadding-accHeight;
        })
        .attr("width",barWidth)
        .attr("height",function(d){
            return yScaler(Number(d[data.columns[index]]));
        })
        .style("fill",colorScaler(index));
    }
    g.append("line")
        .attr("x1",function(d,i){
            return segmentWidth*i+interval+edgePadding+barWidth/2;
        })
        .attr("x2",function(d,i){
            return segmentWidth*i+interval+edgePadding+barWidth/2;
        })
        .attr("y1",canvasHeight-edgePadding)
        .attr("y2",canvasHeight-edgePadding+3)
        .style("stroke","black")
        .style("stroke-width",0.75);
    g.append("text")
        .text(function(d){
            return d.State;
        })
        .attr("x",function(d,i){
            return segmentWidth*i+interval+edgePadding+barWidth/2;
        })
        .attr("y",canvasHeight-edgePadding+5)
        .attr("text-anchor","middle")
        .attr("alignment-baseline","hanging")
        .style("font-size", "7px");
    yAxis = d3.axisLeft(d3.scaleLinear().domain([0,maxPop/1000000]).range([canvasHeight-edgePadding,0]));
    var yX = svg.append("g")
    yX.call(yAxis)
        .attr("transform","rotate(180)")
        .attr("transform","translate("+edgePadding+",0)");
    d3.selectAll(".tick")
        .select("text")
        .text(function(){return this.innerHTML+"M"});
    yX.append("text")
        .text("Population")
        .attr("x",0)
        .attr("y",20)
        .attr("fill","black")
        .attr("transform","rotate(-90)");
    var legend =  svg.append("g");
    legend.selectAll("*").data(data.columns.slice(1))
        .enter()
        .append("text")
        .style("font-size","10px")
        .attr("x",canvasWidth-15)
        .attr("y",function(d,i){
            return i*15+8;
        })
        .attr("text-anchor","end")
        .text(function(d){return d});
    legend.selectAll("rect").data(data.columns.slice(1))
        .enter()
        .append("rect")
        .attr("fill",function(d,i){
            return colorScaler(i);
        })
        .attr("width", 10)
        .attr("height", 10)
        .attr("x",canvasWidth-10)
        .attr("y",function(d,i){
            return i*15;
        });
}

function sort(){
    const TOP=20;
    segmentWidth = (canvasWidth-edgePadding)/TOP;
    barWidth = segmentWidth*barPer;
    interval = segmentWidth*(1-barPer);
    g. sort(function(a,b){
        return d3.descending(totalPop(a),totalPop(b));
        })
        .each(function(d,i){
            d3.select(this)
                .selectAll("rect")
                .transition()
                .delay(function(dd,ii){return i*50+ii*50})
                .duration(1000)
                .attr("x", segmentWidth*i+interval+edgePadding)
                .attr("width",barWidth);
            d3.select(this)
                .selectAll("text")
                .transition()
                .attr("x",segmentWidth*i+interval+edgePadding+barWidth/2)
                .style("font-size", "18px");
            d3.select(this)
                .selectAll("line")
                .transition()
                .attr("x1",segmentWidth*i+interval+edgePadding+barWidth/2)
                .attr("x2",segmentWidth*i+interval+edgePadding+barWidth/2)
                .style("stroke-width",1.25);
            if(i>=TOP)
            d3.select(this).remove();
        });

}

function totalPop(d){
    var total=0;
    for(let i in data.columns){
        if(i>0){
            total+=Number(d[data.columns[i]]);
        }
    }
    return total;
}
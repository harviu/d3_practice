let popData;
let mapData;
let pData;
let drawType='Color';
let dataType='Population';
let mainSvg = document.getElementById('mainSvg');
let plotSvg = document.getElementById('plotSvg');
let dom = [];

d3.csv("census.csv").then((d)=>{
    popData = d;
    popData.splice(1,1);
    popData.splice(10,1);
    
});
d3.json("usa_mainland.json").then(init);



function init (d){
    mapData = d;
    let channelButtons = document.getElementsByClassName('channelChoose');
    for (button of channelButtons){
        button.addEventListener('click',(e)=>{
            drawType = e.toElement.innerText;
            drawMap(drawType);
        });
    }

    let dataButtons = document.getElementsByClassName('dataChoose');
    for (button of dataButtons){
        button.addEventListener('click',(e)=>{
            dataType = e.toElement.innerText;
            drawPlot(dataType);
            drawMap(drawType);
        })
    }

    // initial drawing
    
    // while(popData==undefined);
    drawPlot(dataType);
    drawMap(drawType);
}


function drawMap(drawType){

    // Draw the US map
    while (mainSvg.lastChild) {
        mainSvg.removeChild(mainSvg.lastChild);
    }
    const width = 1000;
    const height = 625;
    let projection = d3.geoAlbersUsa()
        .fitExtent([[0,0],[width, height]],mapData);
    let pathGenerator = d3.geoPath()
        .projection(projection);
    
    let map=d3.select('#mainSvg')
        .selectAll('path')
        .data(mapData.features)
        .enter();

    

    let paths=map
        .append('path')
        .attr('d',pathGenerator)
        .attr('class',"state")
        .attr('id',(d)=>{
            return d.properties.STUSPS10 + "_map";
        });

    let p = document.createElement('p');
    mainSvg.appendChild(p);
    p.setAttribute('id','seperator');
    // note: map works like entre point to mainSVG
    map.append('text')
        .attr('x',(d)=>{
            return pathGenerator.centroid(d)[0];
        })
        .attr('y',(d)=>{
            return pathGenerator.centroid(d)[1];
        })
        .text((d)=>{return d.properties.STUSPS10})
        .style('font-size','9px')
        .attr("text-anchor","middle")
        .attr("alignment-baseline","middle")
        .attr('id',(d)=>{return d.properties.STUSPS10+'_tag';});
    
    // add listener to the selected state map. paths is the object after enter()
    paths.on("click",function(d,_,nodes){
        for (node of nodes){
            /* Change all unselected area back to normal
            nodes is the parent so node of nodes inludes all state paths*/
            node.style.stroke = '#aaa';
            node.style['stroke-width'] = 1;
        }

        //change the selected state
        this.style.stroke = 'orange';
        this.style['stroke-width'] = 2;

        //put the selected to the top or the boundary will draw under other stats
        let p = document.getElementById('seperator');
        mainSvg.removeChild(this);
        mainSvg.insertBefore(this,p);
        
        //added the id to the barchart rects so I can refer them this way 
        for (state_plot of document.getElementsByClassName('plots')){
            state_plot.style.fill = '#ddd';
        }
        document.getElementById(d.properties.STUSPS10+"_plot").style.fill = 'orange';
    });
    
    
    let legend = d3.select('#mainSvg')
            .selectAll('.legend')
    let min,max
    min = pData[0].total;
    max = pData[0].total;
    for (const datum of pData){
        if(datum.total>max) max = datum.total;
        if(datum.total<min) min = datum.total;
    }
    let scaler1 = d3.scaleQuantize().domain([min,max]).range([0,1,2,3,4,5,6])
    let scaler2
    
    if(drawType == 'Color'){
        scaler2 =d3.scaleLinear().domain([0,6]).range([110,310]);
        d3.selectAll('.state')
        .style('fill',(d)=>{
            return 'hsl('+scaler2(scaler1(getValue(d)))+', 80%, 70%, 70%)'
        })

        let node = legend.data([0,1,2,3,4,5,6])
            .enter();
        node.append('rect')
            .attr('width',35)
            .attr('height',35)
            .attr('y',520)
            .attr('x',(d)=>{return 20+d*40})
            .style("fill",(d)=>{return 'hsl('+scaler2(d)+', 80%, 70%,70%)'})
            .style("stroke","#aaa");

        drawLegendText(7);

    }else if(drawType == 'Value'){
        scaler2 = d3.scaleLinear().domain([0,6]).range(['Gainsboro','DimGray']);
        d3.selectAll('.state')
            .style('fill',(d)=>{
                return scaler2(scaler1(getValue(d)));
            })

        let node = legend.data([0,1,2,3,4,5,6])
            .enter();
        node.append('rect')
            .attr('width',35)
            .attr('height',35)
            .attr('y',520)
            .attr('x',(d)=>{return 20+d*40})
            .style("fill",(d)=>{return scaler2(d)})
            .style("stroke","#aaa");

        drawLegendText(7);

    }else if (drawType =="Size"){
        scaler2 = d3.scaleLinear().domain([min,max]).range([10,30])
        map.append('circle')
            .attr('cx',(d)=>{return pathGenerator.centroid(d)[0];})
            .attr('cy',(d)=>{return pathGenerator.centroid(d)[1];})
            .attr('r',(d)=>{return scaler2(getValue(d));})
            .style('fill','#0061ff55')
        
        d3.select('#mainSvg').append('circle')
            .attr('cx',60)
            .attr('cy',520)
            .attr('r',30)
            .style("fill",'#0061ff55')
    
        let legendAxis= d3.axisBottom(d3.scaleLinear().domain([0,min,max]).range([0,10,30]))
        .ticks(3, "s")
        .tickValues([min,max])
        .tickSizeOuter(0);

        d3.select("#mainSvg").append('g')
            .call(legendAxis)
            .attr('transform','translate(60, 520)')
        

        
    }else if (drawType == 'Shape'){
        scaler2 = d3.scaleQuantize().domain([min,max]).range(d3.symbols);
        map.append('path')
        .attr('d',function(d){
            let type = scaler2(getValue(d));
            let shape = d3.symbol().size(600).type(type);
            return shape();
        })
        .attr('transform',(d)=>{
            let x = pathGenerator.centroid(d)[0];
            let y = pathGenerator.centroid(d)[1];
            return 'translate('+ x +','+ y +')';
        })
        .style('fill','#0061ff55')
        let node = legend.data([0,1,2,3,4,5,6])
            .enter();
        node.append('path')
            .attr('d',function(d){
                let sc = d3.scaleOrdinal().domain([0,1,2,3,4,5,6]).range(d3.symbols);
                let type = sc(d);
                let shape = d3.symbol().size(600).type(type);
                return shape();
            })
            .attr('transform',(d)=>{
                let x = 40+40*d;
                let y = 520;
                return 'translate('+ x +','+ y +')';
            })
            .style('fill','#0061ff55');
        drawLegendText(7);
    }else if(drawType == 'Orientation'){
        let t = [];
        let scaler2 = d3.scaleQuantize().domain([min,max]).range([0,1,2,3]);
        for(let i =0;i<4;i++){
            t[i]=textures.lines().orientation(i+'/8').stroke('#0061ff55');
            d3.select('#mainSvg')
            .call(t[i])
        }
        paths.style('fill',function(d){
            return t[scaler2(getValue(d))].url();
        })

         //draw legend
         let node = legend.data([0,1,2,3])
         .enter();
     node.append('rect')
         .attr('width',35)
         .attr('height',35)
         .attr('y',520)
         .attr('x',(d)=>{return 20+d*40})
         .style("fill",(d)=>{return t[d].url()})
         .style("stroke","#aaa");
     
        drawLegendText(4);
        
    }else if (drawType == 'Texture'){
        let t = [];
        let scaler2 = d3.scaleQuantize().domain([min,max]).range([0,1,2,3,4,5,6]);
        t[0] = textures.paths().d("hexagons").size(8)
        .strokeWidth(2)
        .stroke('#0061ff55');
        t[1] = textures.paths().d("crosses").lighter()
        .thicker().stroke('#0061ff55');
        t[2] = textures.paths().d("caps").lighter()
        .thicker().stroke('#0061ff55');
        t[3] = textures.paths().d("woven").lighter()
        .thicker().stroke('#0061ff55');
        t[4] = textures.paths().d("waves")
        .thicker().stroke('#0061ff55');
        t[5] = textures.paths().d("nylon").lighter()
        .stroke('#0061ff55');
        t[6] = textures.paths().d("squares").stroke('#0061ff55');

        for(let i =0;i<7;i++){
            d3.select('#mainSvg')
            .call(t[i])
        }
        paths.style('fill',function(d){
            return t[scaler2(getValue(d))].url();
        })

        //draw legend
        let node = legend.data([0,1,2,3,4,5,6])
            .enter();
        node.append('rect')
            .attr('width',35)
            .attr('height',35)
            .attr('y',520)
            .attr('x',(d)=>{return 20+d*40})
            .style("fill",(d)=>{return t[d].url()})
            .style("stroke","#aaa");
        
        drawLegendText(7);
    }

    function drawLegendText(num){
        let dd = []
        for(let i =0;i<num+1;i++){
            dd[i]=(max-min)*i/num+min;
        }
        
        let legendAxis= d3.axisBottom(d3.scaleLinear().domain([min,max]).range([0,num*40]))
            .ticks(num, "2s")
            .tickValues(dd);
        d3.select('#mainSvg')
            .append('g')
            .call(legendAxis)
            .attr('transform','translate(17.5, 557)')
    }
    function getValue(d){
        let name = d.properties.STUSPS10;
        let v;
        for (const n of pData){
            if (n.State == name){
                v = n.total;
            }
        }
        return v;
    }
}

function drawPlot(dataType){
    // Draw the plot
    while (plotSvg.lastChild) {
        plotSvg.removeChild(plotSvg.lastChild);
    }
    pData=[];
    const barPer = 0.618;
    const canvasWidth = 1000;
    const edgePadding = 50;
    const canvasHeight = 625;
    let yAxis;
    let maxTotal;

    if (dataType == 'Population'){
        maxTotal = 36756666
        pData = popData;
        for (s of pData){
            s.total = 0;
            for(section of pData.columns){
                if (section == 'State') continue;
                s.total += Number(s[section]);
            }
        }
        yAxis= d3.axisLeft(d3.scaleLinear().domain([0,maxTotal/1000000]).range([canvasHeight-edgePadding,0]));
        axisUnit = "M";
        unit = "";
    }else{
        for(let i=0;i<49;i++){
            pData[i]={'State': popData[i].State};
            for (let state of mapData.features){
                if(state.properties.STUSPS10==pData[i].State){
                    pData[i].total = state.properties.ALAND10+state.properties.AWATER10;
                    break;
                }
            }
        }
        maxTotal= 695661617292;
        yAxis= d3.axisLeft(d3.scaleLinear().domain([0,maxTotal/1000000000]).range([canvasHeight-edgePadding,0]));
        axisUnit = "B";
        unit = " / Square meter"
    }

    dom = [];
    for (datum of pData){
        dom.push(datum.total);
    }
    
    
    let yScaler = d3.scaleLinear().domain([0,maxTotal]).range([0,canvasHeight-edgePadding]);
    let segmentWidth = (canvasWidth-edgePadding)/pData.length;
    let barWidth = segmentWidth*barPer;
    let interval = segmentWidth*(1-barPer);
    
    let plots = d3.select('#plotSVG');
    let state=plots.selectAll('*')
        .data(pData)
        .enter();

    // Draw rects
    state.append('rect')
        .attr("x",function(d,i){
            return segmentWidth*i+interval+edgePadding;
        })
        .attr("y",function(d){
            let h = yScaler(d.total);
            return canvasHeight-edgePadding-h;
        })
        .attr("width",barWidth)
        .attr("height",function(d){
            return yScaler(d.total);
        })
        .attr('class','plots')
        .attr('id',(d)=>{
            return d.State+"_plot";
        })

    state.selectAll('rect').on("click",function(d,_,nodes){
            for (node of nodes){
                node.style.fill = '#ddd';
            }
            this.style.fill = 'orange';

            for (state_map of document.getElementsByClassName('state')){
                state_map.style.stroke = '#aaa';
                state_map.style['stroke-width'] = 1;
            }
            let temp = document.getElementById(d.State+"_map");
            temp.style.stroke = 'orange';
            temp.style['stroke-width'] = 2;
            //put the selected to the top
            let p = document.getElementById('seperator');
            mainSvg.removeChild(temp);
            mainSvg.insertBefore(temp,p);
        })

    state.selectAll('rect').on('mouseenter',function(d,_,nodes){
        toolTip = document.createElementNS("http://www.w3.org/2000/svg", "text");
        document.getElementById('plotSvg').appendChild(toolTip);
        toolTip.setAttribute("x" ,d3.event.offsetX);
        toolTip.setAttribute("y" ,d3.event.offsetY);
        toolTip.innerHTML = d.total;
    })

    state.selectAll('rect').on('mousemove',function(d,_,nodes){
        toolTip.setAttribute("x" ,d3.event.offsetX-50);
        toolTip.setAttribute("y" ,d3.event.offsetY-10);
    })

    state.selectAll('rect').on('mouseout',function(d,_,nodes){
        document.getElementById('plotSvg').removeChild(toolTip)
    })

    // Add x index line
    state.append("line")
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
    
    // Draw x index
    state.append("text")
        .text(function(d){
            return d.State;
        })
        .attr("x",function(d,i){
            return segmentWidth*i+interval+edgePadding+barWidth/2;
        })
        .attr("y",canvasHeight-edgePadding+5)
        .attr("text-anchor","middle")
        .attr("alignment-baseline","hanging")
        .style("font-size", "7px")
        .attr('class','stateTag');
    
    //y index
    let yX = plots.append("g");
    yX.call(yAxis)
        .attr("transform","rotate(180)")
        .attr("transform","translate("+edgePadding+",0)");
    d3.selectAll(".tick")
        .select("text")
        .text(function(){return this.innerHTML+axisUnit});
    yX.append("text")
        .text(dataType+unit)
        .attr("x",0)
        .attr("y",20)
        .attr("fill","black")
        .attr("transform","rotate(-90)");
}
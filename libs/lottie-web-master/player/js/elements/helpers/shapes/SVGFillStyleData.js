function SVGFillStyleData(elem, data, styleOb){
	this.initDynamicPropertyContainer(elem);
	this.getValue = this.iterateDynamicProperties;
	this.o = PropertyFactory.getProp(elem,data.o,0,0.01,this);
	this.c = PropertyFactory.getProp(elem,data.c,1,255,this);
	this.style = styleOb;
}

extendPrototype([DynamicPropertyContainer], SVGFillStyleData);

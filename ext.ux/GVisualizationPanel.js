Ext.ux.GDataTableAdapter = function(config) {
    // hashmap to convert from Ext data types
    // datatypes
    var convert = {
        'auto': 'string',
        'string': 'string',
        'int': 'number',
        'float': 'number',
        'boolean': 'boolean',
        'date':'date'    
    };
    

      
    return {
        adapt: function(config) {
            var store = Ext.StoreMgr.lookup(config.store || config.ds);
            var tbl = new google.visualization.DataTable();
            var cols = config.columns;
            for (var i = 0; i < cols.length; i++) {
                var c = cols[i];
                if (c.tooltip && c.template && c.fields) {
                	tbl.addColumn({type: 'string', role:'tooltip'});
                } else {
                	var id = c.dataIndex || c;
                	var f = store.fields.get(id);
                	tbl.addColumn(convert[f.type.type], c.label || c, id);
                }
            }
            var rs = store.getRange();
            tbl.addRows(rs.length);
            for (var i = 0; i < rs.length; i++) {
                for (var j = 0; j < cols.length; j++) {
                	var c = cols[j];
                	if (c.tooltip && c.template && c.fields) {
                		var templateFieldValues = new Object();
                		for (var k = 0; k < c.fields.length; k++) {
                			templateFieldValues[c.fields[k]] = rs[i].get(c.fields[k]);
                		}
               			var tooltip = c.template.apply(templateFieldValues);
               			tbl.setValue(i, j, tooltip);
                	} else {
                		var fld = store.fields.itemAt(j);        
                		tbl.setValue(i, j, rs[i].get(fld.name));
                	}
                }
            }


            if(config.formatter) {
                var formatter = new google.visualization.PatternFormat(config.formatter.pattern);
                formatter.format(tbl, config.formatter.srcIdxs, config.formatter.outIdx);
            }

            return tbl;
        }
    };
      
}();



Ext.ux.GVisualizationPanel = Ext.extend(Ext.Panel, {
    // These are required by Google API
    // To add more visualizations you can extend
    // visualizationPkgs
    visualizationAPI: 'visualization',
    visualizationAPIVer: '1',
    visualizationPkgs: {
        'intensitymap': 'IntensityMap',
        'orgchart': 'OrgChart',
        'linechart': 'LineChart',
        'gauge': 'Gauge',
        'scatterchart': 'ScatterChart'    
    	
    },
    
    /**
     * visualizationPkg {String} 
     * (Required) Valid values are intesitymap, orgchart, gauge and scatterchart
     * The error "Module: 'visualization' with package: '' not found!" will be
     * thrown if you do not use this configuration.
     */
    visualizationPkg: '',
    
    /**
     * html {String}
     * Initial html to show before loading the visualization
     */
    html: 'Loading...',
    visualizationCfg: {},
    
    /**
     * store {Ext.data.Store/String}
     * Any valid instance of a store and/or storeId
     */    
    store: null,
    onParentResize: function( parent, width, height) {
//    	 var heightValue = parent.body.getHeight(true);
//    	 this.visualizationCfg = Ext.apply(this.visualizationCfg, {chartArea: {width: 'auto', height: heightValue}});
//    	 if (this.visualization) {
//    		 this.visualization.draw(this.datatable, Ext.apply({}, this.visualizationCfg));
//    	 }
    	 
     },

    // Overriden methods
    initComponent: function() {
        if (typeof this.visualizationPkg === 'object') {
            Ext.apply(this.visualizationPkgs, this.visualizationPkg);            
            for (var key in this.visualizationPkg) {
                this.visualizationPkg = key;
                break;
            }
        }
        google.load(
            this.visualizationAPI,
            this.visualizationAPIVer,
            {
                packages: [this.visualizationPkg],
                callback: this.onLoadCallback.createDelegate(this)
            }
        );        
        this.store = Ext.StoreMgr.lookup(this.store);
        this.store.addListener('datachanged', this.datachanged, this);
        
        Ext.ux.GVisualizationPanel.superclass.initComponent.call(this,
        {
        	listeners: {
        		'resize': {
        			fn: this.onResize,
        			scope: this,
        			delay: 100
        		}
        	}
        });
    },
    datachanged: function(store) {
    	var tableCfg = {
    	    store: this.store,
    	    columns: this.columns,
            formatter : this.formatter
    	};
    	this.datatable = Ext.ux.GDataTableAdapter.adapt(tableCfg);
    	if (this.visualization) {
    		this.visualization.draw(this.datatable,
    		Ext.apply(
    			{
    				animation:{
    	        		duration: 1000,
    	        		easing: 'out'
    				}
    			}, this.visualizationCfg)
    			);
    	}
    },
    onResize: function(element, adjWidth, adjHeight, rawWidth, rawHeight) {
//    	this.visualizationCfg = Ext.apply(this.visualizationCfg, {chartArea: {width: adjWidth, height: adjHeight}});
//    	if (this.visualization) {
//    		this.visualization.draw(this.datatable, Ext.apply({}, this.visualizationCfg));
//    	}

    },
    
    // custom methods
    onLoadCallback: function() {
        var tableCfg = {
            store: this.store,
            columns: this.columns,
            formatter: this.formatter
        };
        this.datatable = Ext.ux.GDataTableAdapter.adapt(tableCfg);
        
        var cls = this.visualizationPkgs[this.visualizationPkg];
        this.body.update('');
        this.visualization = new google.visualization[cls](this.body.dom);
        
        var relaySelect = function() {
            this.fireEvent('select', this, this.visualization);
        };
        google.visualization.events.addListener(this.visualization, 'select', relaySelect.createDelegate(this));
        this.visualization.draw(this.datatable, Ext.apply({}, this.visualizationCfg));
    }    
});
Ext.reg('gvisualization', Ext.ux.GVisualizationPanel);


/**
 * Copyright (C) 2013
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio Hernández <ahernandez@emergya.com>
 *
 * @require OpenLayers/WPSClient.js
 */

Viewer.dialog.StoredSearchWindow = Ext.extend(Ext.Window, {

    ptype: 'viewer_storedSearchWindow',

    controller: null,

    formFields: null,

    columns : {
        "CENTRALES" : ["TIPO","NOMBRE","PROPIETARIO","POT_BR_MW", "N_UNIDADES", "TIPO", "RCA", "SISTE_ELEC", "REGION", "PROVINCIA", "COMUNA", "COMBUSTIBL", "EMI_RCA", "CUENCA"],
        "Proyectos_SEA" : ["NOMBRE","PROPIETARI","POT_BR_MW", "EMI_RCA", "CAUDAL_ECO", "REGION", "PROVINCIA", "COMUNA"]
    },

    // We define the translations of the column names into human readable names. If not present here, 
    // we will just take the column's name and lowercase it (except the first letter).
    columnLabels : {
        "POT_BR_MW" : "Potencia Bruta (MW)" ,
        "N_UNIDADES" : "Nº Unidades",
        "RCA": "Resolución de Calificación Ambiental",
        "SISTE_ELEC": "Sistema Eléctrico",
        "COMBUSTIBL": "Combustible",
        "EMI_RCA": "Emisiones según R.C.A.",
        "PROPIETARI" : "Propietario",
        "CAUDAL_ECO": "Caudal Ecológico",
        "REGION": "Región"        
    },

    
    /** api: config[closest]
     *  ``Boolean`` Find the zoom level that most closely fits the specified
     *  extent. Note that this may result in a zoom that does not exactly
     *  contain the entire extent.  Default is false.
     */
    closest: false,
    
    /** api: config[autoExpand]
     *  ``String`` Reference to feature grid table to expand on show
     */
    autoExpand: "table",

    showWMSLayer: true,

    constructor: function(config) {

        var constructor = Viewer.controller[config.controller];
        this.controller = new constructor(config);

        // Important!
        delete config.controller;

        this.controller.on({
            load: this.onQueryLoaded,
            loadError: this.onQueryLoadError,
            scope: this
        });

        this.listeners = {
            beforerender: this.onBeforeRender,
            afterrender: this.onAfterRender,
            scope: this
        };

        Viewer.dialog.StoredSearchWindow.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_storedsearch_window',
            title: this.controller.title,
            width: 800,
            height: 320,
            closeAction: 'hide',
            layout: 'fit',
        }, config));
    },

    onShow: function() {

        this._manager = this.target.target.tools[this.featureManager];

        this.grid = new gxp.grid.FeatureGrid({
            map: this.map,
            ignoreFields: ['the_geom'],
            height: 200
        });

        var layer = new OpenLayers.Layer.WMS(this.controller.title,
                this.controller.wfsServiceUrl.replace('wfs', 'wms'), {
                    layers : this.controller.featureType,
                    transparent : true
                }, {
                    format : 'image/png',
                    isBaseLayer : false,
                    visibility : true,
                    opacity : 0.9,
                    buffer : 0
                });

        if(this.showWMSLayer){
            this.controller.layer = this.wmsLayer = layer;
            this.target.target.mapPanel.map.addLayer(this.wmsLayer);
        }
        // copy to record type
        var  recordType = GeoExt.data.LayerRecord.create([{name: "name", type: "string"}]);
        this.recordLayer = new recordType({
            name: layer.name,
            source: this.target.target.sources.local,
            layer: layer
        }, layer);
        this.target.target.selectLayer(this.recordLayer);
        this.onSearchButtonClicked();

        this.controller.onShow();
    },

    onHide: function() {
        if(!!this.wmsLayer){
            this.target.target.mapPanel.map.removeLayer(this.wmsLayer);
        }
        this.showGrid(false);
        this.controller.onHide();
    },

    onFilterChanged: function(widget, store, value) {
        try {
            this.controller.queryDefIndex[widget.name].comparison = widget.getValue();
        } catch(e) {}
    },

    onValueChanged: function(widget, store, value) {
        try {
            this.controller.queryDefIndex[widget.name].value = widget.getValue();
        } catch(e) {}
    },

    showLoadMask: function(show){
        // if(show){
        //     this.loadMask || (this.loadMask = new Ext.LoadMask(
        //         this.getId(),
        //         { msg: 'Buscando...' }
        //     ));
        //     this.loadMask.show();
        // }else if(!!this.loadMask && !!this.loadMask.hide){
        //     this.loadMask.hide();
        // }
    },

    onSearchButtonClicked: function(widget, evt) {

        for (var i=0, l=this.controller.queryDef.length; i<l; i++) {
            var item = this.controller.queryDef[i];
            var field = this.formFields[item.property];
            item.value = field.getValue();
        }

        //this.showLoadMask(true);

        //TODO: HANDLE here this.controller.doRequest();

        var xmlQueryAdapter = new Viewer.plugins.XmlQueryAdapter({
            queryDef:this.controller.queryDef
        });

        var ogcFilter = xmlQueryAdapter.getParse();

        this.controller.layer.params['FILTER'] = xmlQueryAdapter.getWMSFilterParam();
        this.controller.layer.redraw();


        this._manager.loadFeatures(ogcFilter, function (){
            console.log("here2");  
            this.grid.setStore(this._manager.featureStore);
            this.showGrid(true);
            this.btnZoomToResult.setDisabled(false);
            this.btnPrint.setDisabled(false);
        }, this);
    },

    showGrid: function(show){
        var expandContainer = Ext.getCmp(this.autoExpand);
        if(show){
            expandContainer.expand();
            if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                expandContainer.ownerCt.expand();
            }
        }else{
            expandContainer.collapse();
            if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                expandContainer.ownerCt.collapse();
            }
        }
        this.showLoadMask(false);
    },

    onQueryLoaded: function(features) {
        this.showLoadMask(false);
        console.info('load', features);
    },

    onQueryLoadError: function(response) {
        this.showLoadMask(false);
        Ext.Msg.show({
            title: 'Error en la petición',
            msg: response.message,
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ERROR
        });
        console.warn('loadError', response);
    },

    replaceAll: function (origin, match, replacement){
        if (origin.indexOf(match)> -1){
            // recursive case
            return this.replaceAll(origin.replace(match, replacement), match, replacement);
        }else{
            // base case
            return origin;
        }

    },

    onBeforeRender: function() {

        var components = new Viewer.plugins.FormQueryAdapter()
            .parse(this.controller.formDef);

        var formContainer = new Ext.FormPanel({
            labelWidth: 120,
            buttons: [
                this.btnZoomToResult = new Ext.Button({
                    text: 'Centrar',
                    disabled: true,
                    listeners: {
                        click: function(){
                            this.zoomToLayerExtent();
                        },
                        scope: this
                    }
                }),
                this.btnPrint = new Ext.Button({
                    text: 'Imprimir',
                    disabled: true,
                    listeners: {
                        click: this._printResults,
                        scope: this
                    }   
                }),
                this.btnClear = new Ext.Button({
                    text: 'Limpiar',
                    listeners: {
                        click: function(){
                            this.controller.clearForm();
                            this.onSearchButtonClicked();
                        },
                        scope: this
                    }   
                }),
                this.btnSearch = new Ext.Button({
                    text: 'Buscar',
                    listeners: {
                        click: this.onSearchButtonClicked,
                        scope: this
                    }   
                })
            ]
        });

        for (var i=0, l=components.length; i<l; i++) {

            var condition = components[i];

            if (condition.filters) {

                formContainer.add({
                    xtype: 'compositefield',
                    anchor: '-20',
                    items: [
                        Ext.apply(condition.filters, {
                            listeners: {
                                select: this._getFieldHandler(condition['onChange'], this.onFilterChanged.createDelegate(this)),
                                scope: this
                            }
                        }),
                        Ext.apply(condition.values, {
                            listeners: {
                                select: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                                keypress: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                                scope: this
                            }
                        })
                    ]
                });

            } else if (condition.values) {

                formContainer.add(Ext.apply(condition.values, {
                    listeners: {
                        select: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                        keypress: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                        scope: this
                    }
                }));
            }
        }     

        this.add(formContainer);
    },

    _printResults : function() {
        var pageWidth = 215.9;
        var margin = 30;
        var avalaibleWidth = pageWidth - 2 * margin;

        var items = this.createPDFDocument(margin, pageWidth, avalaibleWidth);
        if(!items) {
            return;
        }

        var params = {
            size: "letter",
            margin: {
                top: 45,
                bottom: 30,
                left: 30,
                right: 30
            }, // mm
            title: this.controller.title,
            columns: 2,
            items: items,
            outputFile: this.controller.title.toLowerCase().replace(/ /g,"_"),
            keepFile: true,
            header: {
                margin: 10,
                items: [
                    {
                        type: "image",
                        url: "http://localhost:9080/theme/app/img/logo_ministerio.png",
                        height: 25
                    },
                    {
                        type: "par",
                        text: this.controller.title,
                        x: 65,
                        y: 15,                       
                        newFont : {
                            size: 14
                        }
                    }
                ]
            },
            footer: {
                margin: 15,
                items : [{
                    type: "html",
                    content: '<a href="http://sig.minenergia.cl/sig-minen">http://sig.minenergia.cl/sig-minen</a>',
                    keepPosition:true
                },{
                    text: "Página %PAGE_NUMBER%",
                    align: "L",
                    x: pageWidth-margin -17
                }]
            }
        };

        Ext.MessageBox.wait("Por favor espere...");

        var url = app.proxy + "http://localhost/phpPDF/phpPDF.php";

        Ext.Ajax.request({
            url: url,
            params: {
                params: Ext.encode(params)
            },
            isUpload: true,
            success: function(response) {
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                // We should have get a json text here

                var result = Ext.decode(response.responseText);

                // We can use localhost this way because of the proxy
                app.downloadFile(url, {
                    params: Ext.encode({
                        downloadFile: result.downloadableFile,
                        outputFormat: "PDF"
                    })
                });
            },
            failure: function(response) {
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                Ext.MessageBox.alert("", this.errorText)
            },
            scope: this
        })
    },

    createPDFDocument: function(margin, pageWidth, avalaibleWidth) {
        //We generate an XTemplate here by using 2 intermediary XTemplates - one to create the header,
        //the other to create the body (see the escaped {} below)
        var columns = this.grid.getColumnModel().config;

        if(!columns || !columns.length ) {
            Ext.Msg.alert("","Por favor, realice una búsqueda primero.");
            return false;
        }

        
        //build a useable array of store data for the XTemplate
        var data = [];
        this.grid.store.data.each(function(item) {
          var convertedData = [];

          //apply renderers from column model
          for (var key in item.data) {
            var value = item.data[key];
            
            Ext.each(columns, function(column) {
              if (column.dataIndex == key) {
                convertedData[key] = column.renderer ? column.renderer(value) : value;
              }
            }, this);
          }
          
          data.push(convertedData);
        });

        var featureColumns = this.columns[this.controller.featureType];

        // We remove the colums that have no data because its not applicable.
         columns = columns.filter(function(column, index){

            if(featureColumns.indexOf(column.dataIndex)<0) {
                // The column shouldn't be added per customer request.
                return false;
            }

            var headerLabel = this.columnLabels[column.dataIndex];
            if(!headerLabel) {
                headerLabel = column.header.charAt(0).toUpperCase() + column.header.slice(1).toLowerCase();
            }

            column.headerLabel = headerLabel;


            for(var i = 0; i < data.length; i++) {
                if(data[i][column.dataIndex] !== "No Aplica") {
                    return true;
                }
            }

            return false;
        },this);

         
        //var content  = this._cratePDFTable(columns, data);
        var content = this._createList(columns, data);
        

        var items = [{
            type: "html",
            content: content,
            newFont : {
                size: 8
            }
        }];
        return items;
    },

    _createList : function(columns, data) {

        var bodyTemplate = new Ext.XTemplate(      
            '<li><dt><b>\{{values.firstCol.dataIndex}\}</b></dt>',
            '<dd>',
                '<ul>',
                    '<tpl for="otherColumns">',
                        '<li><i>{headerLabel}</i>: \{{dataIndex}\}</li>',                                                   
                    '</tpl>',
                '</ul>',
            '</dd></li>');

        bodyTemplate = bodyTemplate.apply({firstCol :  columns[0], otherColumns: columns.slice(1)});
        
        var html = new Ext.XTemplate(          
              '<ul style="margin-left:0">',     
                '<tpl for=".">',                              
                    bodyTemplate,
                '</tpl>',               
              '</ul>'
        ).apply(data);

        return html;
    },    

    _createPDFTable : function (columns, data) {
        // We convert the columns in a multi row structure.
         var maxColumns = 3;

         var rows = [];

         var row = [columns[0]]; // We add the name column first.
         // We set the rowspan for the name column. We add -1 to not apply to the name column itself!
         columns[0].rowspan = Math.ceil((columns.length -1)/ maxColumns); 
         columns[0].colspan = 1;
         for(var cIdx = 1; cIdx < columns.length; cIdx ++) {
            // Other columns rowspan is always 1
            columns[cIdx].rowspan = 1;
            columns[cIdx].colspan = 1;


            if(cIdx == columns.length-1 && cIdx % maxColumns != 0) {
                // The last column isn't in the last position, so we need
                // colspan!
                columns[cIdx].colspan = maxColumns - (cIdx % maxColumns) + 1;
            }

            row.push(columns[cIdx]);


            if(cIdx % maxColumns ==0 || cIdx == columns.length-1) {
                // The row is finished!
                rows.push(row);
                // A new row is started.
                row = [];
            }
         }


        var headerTemplate = new Ext.XTemplate(
            '<tpl for=".">',
                '<tr nobr="true" style="background-color: gray" border="0.1mm">',
                  '<tpl for=".">',
                    '<th rowspan="{rowspan}" colspan="{colspan}">{headerLabel}</th>',
                  '</tpl>',
                '</tr>',
            '</tpl>'
          );
        var bodyTemplate = new Ext.XTemplate(       
           
                '<tpl for="rows">',
                    '<tr style="background-color:{[parent.odd? "lightgray":"white"]}">',
                      '<tpl for=".">',
                        '<td rowspan="{rowspan}" colspan="{colspan}">\{{dataIndex}\}</td>',
                      '</tpl>',
                    '</tr>',
                '</tpl>');
        
        //use the headerTpl and bodyTpl XTemplates to create the main XTemplate below
        var headings = headerTemplate.apply(rows);
        var bodyOddTemplate    = bodyTemplate.apply({
            rows: rows,
            odd:true
        });
        var bodyEvenTemplate = bodyTemplate.apply({
            rows: rows,
            odd: false
        });
        
        var html = new Ext.XTemplate(          
              '<table border="0.1mm" cellpadding="0.5mm">',
                '<thead>',
                headings,
                '</thead>',
                '<tbody>',
                    '<tpl for=".">',    
                        '<tpl if="xindex % 2 == 0">',                    
                            bodyOddTemplate,
                        '</tpl>',
                        '<tpl if="xindex % 2 != 0">',
                            bodyEvenTemplate,
                        '</tpl>',
                    '</tpl>',
                '</tbody>',
              '</table>'
        ).apply(data);

        return html;
    },

    _getFieldHandler: function(handler1, handler2) {
        return typeof(handler1) == 'function'
            ? function(widget, store, value) {
                    handler2(widget, store, value);
                    handler1(widget, store, value, this.formFields);
                }.createDelegate(this)
            : handler2;
    },

    onAfterRender: function() {
        this.formFields = {};
        var formFields = Viewer.getByClass('vw-stored-search-field');
        for (var i=0,l=formFields.items.length; i<l; i++) {
            var field = formFields.items[i];
            this.formFields[field.name] = field;
        }
        this.controller.formFields = this.formFields;
        this.controller.onAfterRender();
    },

    /** api: method[zoomToLayerExtent]
     * 
     * Zoom to layer extent
     */
    zoomToLayerExtent: function() {
        var map = this.target.target.mapPanel.map;

        var extent = this._manager.getPageExtent(); // get extent from page
        if(!extent){
            var layer = this.controller.layer;
            if (OpenLayers.Layer.Vector) {
                dataExtent = layer instanceof OpenLayers.Layer.Vector &&
                    layer.getDataExtent();
            }
            extent =  layer.restrictedExtent || dataExtent || layer.maxExtent || map.maxExtent;
        }
        
        if (extent) {
            // respect map properties
            var restricted = map.restrictedExtent || map.maxExtent;
            if (restricted) {
                extent = new OpenLayers.Bounds(
                    Math.max(extent.left, restricted.left),
                    Math.max(extent.bottom, restricted.bottom),
                    Math.min(extent.right, restricted.right),
                    Math.min(extent.top, restricted.top)
                );
            }
            map.zoomToExtent(extent, this.closest);
        }
    }
});

Ext.reg('viewer_storedSearchWindow', Viewer.dialog.StoredSearchWindow);

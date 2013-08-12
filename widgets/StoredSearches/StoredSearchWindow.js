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
        "POT_BR_MW" : "Potencia Total (MW)" ,
        "N_UNIDADES" : "Nº Unidades",
        "RCA": "Resolución de Calificación Ambiental",
        "SISTE_ELEC": "Sistema Eléctrico",
        "COMBUSTIBL": "Tipo de combustible",
        "EMI_RCA": "Emisiones establecidas en RCA",
        "PROPIETARI" : "Propietario",
        "CAUDAL_ECO": "Caudal Ecológico (m³/seg)",        
        "REGION": "Región"        
    },

    errorText: "Ocurrió un error.",

    
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

        this.grid.on("reconfigure", function(grid, store, colModel){

            if(colModel.config && colModel.config.length) {
                this.btnZoomToResult.setDisabled(false);
                this.btnPrint.setDisabled(false);
            }
        },this);

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
            this.grid.setStore(this._manager.featureStore);
            this.showGrid(true);
            
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
            outputFile: this._latinize(this.controller.title),
            keepFile: true,
            header: {
                margin: 10,
                items: [
                    {
                        type: "image",
                        url: "http://sig.minenergia.cl/sig-minen/moduloCartografico/theme/app/img/logo_ministerio.png",
                        height: 25
                    },
                    {
                        type: "par",
                        text: this.controller.title.toUpperCase(),
                        align: "C",
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
                    text: (new Date()).format("d/m/Y"),
                    keepPosition: true
                },{
                    type: "html",
                    content: '<a href="http://sig.minenergia.cl/sig-minen/moduloCartografico">http://sig.minenergia.cl/sig-minen/moduloCartografico</a>',
                    keepPosition:true,
                    x: pageWidth/2 - 47
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
                if(result.error) {
                    console.log(result.error);
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("", this.errorText)
                }

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

    _latinize: function(text) {
        var latin_map={"Á":"A","Ă":"A","Ắ":"A","Ặ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ǎ":"A","Â":"A","Ấ":"A","Ậ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ä":"A","Ǟ":"A","Ȧ":"A","Ǡ":"A","Ạ":"A","Ȁ":"A","À":"A","Ả":"A","Ȃ":"A","Ā":"A","Ą":"A","Å":"A","Ǻ":"A","Ḁ":"A","Ⱥ":"A","Ã":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ḃ":"B","Ḅ":"B","Ɓ":"B","Ḇ":"B","Ƀ":"B","Ƃ":"B","Ć":"C","Č":"C","Ç":"C","Ḉ":"C","Ĉ":"C","Ċ":"C","Ƈ":"C","Ȼ":"C","Ď":"D","Ḑ":"D","Ḓ":"D","Ḋ":"D","Ḍ":"D","Ɗ":"D","Ḏ":"D","ǲ":"D","ǅ":"D","Đ":"D","Ƌ":"D","Ǳ":"DZ","Ǆ":"DZ","É":"E","Ĕ":"E","Ě":"E","Ȩ":"E","Ḝ":"E","Ê":"E","Ế":"E","Ệ":"E","Ề":"E","Ể":"E","Ễ":"E","Ḙ":"E","Ë":"E","Ė":"E","Ẹ":"E","Ȅ":"E","È":"E","Ẻ":"E","Ȇ":"E","Ē":"E","Ḗ":"E","Ḕ":"E","Ę":"E","Ɇ":"E","Ẽ":"E","Ḛ":"E","Ꝫ":"ET","Ḟ":"F","Ƒ":"F","Ǵ":"G","Ğ":"G","Ǧ":"G","Ģ":"G","Ĝ":"G","Ġ":"G","Ɠ":"G","Ḡ":"G","Ǥ":"G","Ḫ":"H","Ȟ":"H","Ḩ":"H","Ĥ":"H","Ⱨ":"H","Ḧ":"H","Ḣ":"H","Ḥ":"H","Ħ":"H","Í":"I","Ĭ":"I","Ǐ":"I","Î":"I","Ï":"I","Ḯ":"I","İ":"I","Ị":"I","Ȉ":"I","Ì":"I","Ỉ":"I","Ȋ":"I","Ī":"I","Į":"I","Ɨ":"I","Ĩ":"I","Ḭ":"I","Ꝺ":"D","Ꝼ":"F","Ᵹ":"G","Ꞃ":"R","Ꞅ":"S","Ꞇ":"T","Ꝭ":"IS","Ĵ":"J","Ɉ":"J","Ḱ":"K","Ǩ":"K","Ķ":"K","Ⱪ":"K","Ꝃ":"K","Ḳ":"K","Ƙ":"K","Ḵ":"K","Ꝁ":"K","Ꝅ":"K","Ĺ":"L","Ƚ":"L","Ľ":"L","Ļ":"L","Ḽ":"L","Ḷ":"L","Ḹ":"L","Ⱡ":"L","Ꝉ":"L","Ḻ":"L","Ŀ":"L","Ɫ":"L","ǈ":"L","Ł":"L","Ǉ":"LJ","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ń":"N","Ň":"N","Ņ":"N","Ṋ":"N","Ṅ":"N","Ṇ":"N","Ǹ":"N","Ɲ":"N","Ṉ":"N","Ƞ":"N","ǋ":"N","Ñ":"N","Ǌ":"NJ","Ó":"O","Ŏ":"O","Ǒ":"O","Ô":"O","Ố":"O","Ộ":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ö":"O","Ȫ":"O","Ȯ":"O","Ȱ":"O","Ọ":"O","Ő":"O","Ȍ":"O","Ò":"O","Ỏ":"O","Ơ":"O","Ớ":"O","Ợ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ȏ":"O","Ꝋ":"O","Ꝍ":"O","Ō":"O","Ṓ":"O","Ṑ":"O","Ɵ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Õ":"O","Ṍ":"O","Ṏ":"O","Ȭ":"O","Ƣ":"OI","Ꝏ":"OO","Ɛ":"E","Ɔ":"O","Ȣ":"OU","Ṕ":"P","Ṗ":"P","Ꝓ":"P","Ƥ":"P","Ꝕ":"P","Ᵽ":"P","Ꝑ":"P","Ꝙ":"Q","Ꝗ":"Q","Ŕ":"R","Ř":"R","Ŗ":"R","Ṙ":"R","Ṛ":"R","Ṝ":"R","Ȑ":"R","Ȓ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꜿ":"C","Ǝ":"E","Ś":"S","Ṥ":"S","Š":"S","Ṧ":"S","Ş":"S","Ŝ":"S","Ș":"S","Ṡ":"S","Ṣ":"S","Ṩ":"S","Ť":"T","Ţ":"T","Ṱ":"T","Ț":"T","Ⱦ":"T","Ṫ":"T","Ṭ":"T","Ƭ":"T","Ṯ":"T","Ʈ":"T","Ŧ":"T","Ɐ":"A","Ꞁ":"L","Ɯ":"M","Ʌ":"V","Ꜩ":"TZ","Ú":"U","Ŭ":"U","Ǔ":"U","Û":"U","Ṷ":"U","Ü":"U","Ǘ":"U","Ǚ":"U","Ǜ":"U","Ǖ":"U","Ṳ":"U","Ụ":"U","Ű":"U","Ȕ":"U","Ù":"U","Ủ":"U","Ư":"U","Ứ":"U","Ự":"U","Ừ":"U","Ử":"U","Ữ":"U","Ȗ":"U","Ū":"U","Ṻ":"U","Ų":"U","Ů":"U","Ũ":"U","Ṹ":"U","Ṵ":"U","Ꝟ":"V","Ṿ":"V","Ʋ":"V","Ṽ":"V","Ꝡ":"VY","Ẃ":"W","Ŵ":"W","Ẅ":"W","Ẇ":"W","Ẉ":"W","Ẁ":"W","Ⱳ":"W","Ẍ":"X","Ẋ":"X","Ý":"Y","Ŷ":"Y","Ÿ":"Y","Ẏ":"Y","Ỵ":"Y","Ỳ":"Y","Ƴ":"Y","Ỷ":"Y","Ỿ":"Y","Ȳ":"Y","Ɏ":"Y","Ỹ":"Y","Ź":"Z","Ž":"Z","Ẑ":"Z","Ⱬ":"Z","Ż":"Z","Ẓ":"Z","Ȥ":"Z","Ẕ":"Z","Ƶ":"Z","Ĳ":"IJ","Œ":"OE","ᴀ":"A","ᴁ":"AE","ʙ":"B","ᴃ":"B","ᴄ":"C","ᴅ":"D","ᴇ":"E","ꜰ":"F","ɢ":"G","ʛ":"G","ʜ":"H","ɪ":"I","ʁ":"R","ᴊ":"J","ᴋ":"K","ʟ":"L","ᴌ":"L","ᴍ":"M","ɴ":"N","ᴏ":"O","ɶ":"OE","ᴐ":"O","ᴕ":"OU","ᴘ":"P","ʀ":"R","ᴎ":"N","ᴙ":"R","ꜱ":"S","ᴛ":"T","ⱻ":"E","ᴚ":"R","ᴜ":"U","ᴠ":"V","ᴡ":"W","ʏ":"Y","ᴢ":"Z","á":"a","ă":"a","ắ":"a","ặ":"a","ằ":"a","ẳ":"a","ẵ":"a","ǎ":"a","â":"a","ấ":"a","ậ":"a","ầ":"a","ẩ":"a","ẫ":"a","ä":"a","ǟ":"a","ȧ":"a","ǡ":"a","ạ":"a","ȁ":"a","à":"a","ả":"a","ȃ":"a","ā":"a","ą":"a","ᶏ":"a","ẚ":"a","å":"a","ǻ":"a","ḁ":"a","ⱥ":"a","ã":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ḃ":"b","ḅ":"b","ɓ":"b","ḇ":"b","ᵬ":"b","ᶀ":"b","ƀ":"b","ƃ":"b","ɵ":"o","ć":"c","č":"c","ç":"c","ḉ":"c","ĉ":"c","ɕ":"c","ċ":"c","ƈ":"c","ȼ":"c","ď":"d","ḑ":"d","ḓ":"d","ȡ":"d","ḋ":"d","ḍ":"d","ɗ":"d","ᶑ":"d","ḏ":"d","ᵭ":"d","ᶁ":"d","đ":"d","ɖ":"d","ƌ":"d","ı":"i","ȷ":"j","ɟ":"j","ʄ":"j","ǳ":"dz","ǆ":"dz","é":"e","ĕ":"e","ě":"e","ȩ":"e","ḝ":"e","ê":"e","ế":"e","ệ":"e","ề":"e","ể":"e","ễ":"e","ḙ":"e","ë":"e","ė":"e","ẹ":"e","ȅ":"e","è":"e","ẻ":"e","ȇ":"e","ē":"e","ḗ":"e","ḕ":"e","ⱸ":"e","ę":"e","ᶒ":"e","ɇ":"e","ẽ":"e","ḛ":"e","ꝫ":"et","ḟ":"f","ƒ":"f","ᵮ":"f","ᶂ":"f","ǵ":"g","ğ":"g","ǧ":"g","ģ":"g","ĝ":"g","ġ":"g","ɠ":"g","ḡ":"g","ᶃ":"g","ǥ":"g","ḫ":"h","ȟ":"h","ḩ":"h","ĥ":"h","ⱨ":"h","ḧ":"h","ḣ":"h","ḥ":"h","ɦ":"h","ẖ":"h","ħ":"h","ƕ":"hv","í":"i","ĭ":"i","ǐ":"i","î":"i","ï":"i","ḯ":"i","ị":"i","ȉ":"i","ì":"i","ỉ":"i","ȋ":"i","ī":"i","į":"i","ᶖ":"i","ɨ":"i","ĩ":"i","ḭ":"i","ꝺ":"d","ꝼ":"f","ᵹ":"g","ꞃ":"r","ꞅ":"s","ꞇ":"t","ꝭ":"is","ǰ":"j","ĵ":"j","ʝ":"j","ɉ":"j","ḱ":"k","ǩ":"k","ķ":"k","ⱪ":"k","ꝃ":"k","ḳ":"k","ƙ":"k","ḵ":"k","ᶄ":"k","ꝁ":"k","ꝅ":"k","ĺ":"l","ƚ":"l","ɬ":"l","ľ":"l","ļ":"l","ḽ":"l","ȴ":"l","ḷ":"l","ḹ":"l","ⱡ":"l","ꝉ":"l","ḻ":"l","ŀ":"l","ɫ":"l","ᶅ":"l","ɭ":"l","ł":"l","ǉ":"lj","ſ":"s","ẜ":"s","ẛ":"s","ẝ":"s","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ᵯ":"m","ᶆ":"m","ń":"n","ň":"n","ņ":"n","ṋ":"n","ȵ":"n","ṅ":"n","ṇ":"n","ǹ":"n","ɲ":"n","ṉ":"n","ƞ":"n","ᵰ":"n","ᶇ":"n","ɳ":"n","ñ":"n","ǌ":"nj","ó":"o","ŏ":"o","ǒ":"o","ô":"o","ố":"o","ộ":"o","ồ":"o","ổ":"o","ỗ":"o","ö":"o","ȫ":"o","ȯ":"o","ȱ":"o","ọ":"o","ő":"o","ȍ":"o","ò":"o","ỏ":"o","ơ":"o","ớ":"o","ợ":"o","ờ":"o","ở":"o","ỡ":"o","ȏ":"o","ꝋ":"o","ꝍ":"o","ⱺ":"o","ō":"o","ṓ":"o","ṑ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","õ":"o","ṍ":"o","ṏ":"o","ȭ":"o","ƣ":"oi","ꝏ":"oo","ɛ":"e","ᶓ":"e","ɔ":"o","ᶗ":"o","ȣ":"ou","ṕ":"p","ṗ":"p","ꝓ":"p","ƥ":"p","ᵱ":"p","ᶈ":"p","ꝕ":"p","ᵽ":"p","ꝑ":"p","ꝙ":"q","ʠ":"q","ɋ":"q","ꝗ":"q","ŕ":"r","ř":"r","ŗ":"r","ṙ":"r","ṛ":"r","ṝ":"r","ȑ":"r","ɾ":"r","ᵳ":"r","ȓ":"r","ṟ":"r","ɼ":"r","ᵲ":"r","ᶉ":"r","ɍ":"r","ɽ":"r","ↄ":"c","ꜿ":"c","ɘ":"e","ɿ":"r","ś":"s","ṥ":"s","š":"s","ṧ":"s","ş":"s","ŝ":"s","ș":"s","ṡ":"s","ṣ":"s","ṩ":"s","ʂ":"s","ᵴ":"s","ᶊ":"s","ȿ":"s","ɡ":"g","ᴑ":"o","ᴓ":"o","ᴝ":"u","ť":"t","ţ":"t","ṱ":"t","ț":"t","ȶ":"t","ẗ":"t","ⱦ":"t","ṫ":"t","ṭ":"t","ƭ":"t","ṯ":"t","ᵵ":"t","ƫ":"t","ʈ":"t","ŧ":"t","ᵺ":"th","ɐ":"a","ᴂ":"ae","ǝ":"e","ᵷ":"g","ɥ":"h","ʮ":"h","ʯ":"h","ᴉ":"i","ʞ":"k","ꞁ":"l","ɯ":"m","ɰ":"m","ᴔ":"oe","ɹ":"r","ɻ":"r","ɺ":"r","ⱹ":"r","ʇ":"t","ʌ":"v","ʍ":"w","ʎ":"y","ꜩ":"tz","ú":"u","ŭ":"u","ǔ":"u","û":"u","ṷ":"u","ü":"u","ǘ":"u","ǚ":"u","ǜ":"u","ǖ":"u","ṳ":"u","ụ":"u","ű":"u","ȕ":"u","ù":"u","ủ":"u","ư":"u","ứ":"u","ự":"u","ừ":"u","ử":"u","ữ":"u","ȗ":"u","ū":"u","ṻ":"u","ų":"u","ᶙ":"u","ů":"u","ũ":"u","ṹ":"u","ṵ":"u","ᵫ":"ue","ꝸ":"um","ⱴ":"v","ꝟ":"v","ṿ":"v","ʋ":"v","ᶌ":"v","ⱱ":"v","ṽ":"v","ꝡ":"vy","ẃ":"w","ŵ":"w","ẅ":"w","ẇ":"w","ẉ":"w","ẁ":"w","ⱳ":"w","ẘ":"w","ẍ":"x","ẋ":"x","ᶍ":"x","ý":"y","ŷ":"y","ÿ":"y","ẏ":"y","ỵ":"y","ỳ":"y","ƴ":"y","ỷ":"y","ỿ":"y","ȳ":"y","ẙ":"y","ɏ":"y","ỹ":"y","ź":"z","ž":"z","ẑ":"z","ʑ":"z","ⱬ":"z","ż":"z","ẓ":"z","ȥ":"z","ẕ":"z","ᵶ":"z","ᶎ":"z","ʐ":"z","ƶ":"z","ɀ":"z","ﬀ":"ff","ﬃ":"ffi","ﬄ":"ffl","ﬁ":"fi","ﬂ":"fl","ĳ":"ij","œ":"oe","ﬆ":"st","ₐ":"a","ₑ":"e","ᵢ":"i","ⱼ":"j","ₒ":"o","ᵣ":"r","ᵤ":"u","ᵥ":"v","ₓ":"x"};
        return text.replace(/[^A-Za-z0-9\[\] ]/g,function(a){return latin_map[a]||a});        
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
        var content = this._createPDFList(columns, data);
        

        // We add a summary at the end of the document.
        content+="<p><b>Número de registros encontrados: </b>" +data.length+"</p>";

        if(featureColumns.indexOf("POT_BR_MW")) {
            var potBrut = data.reduce(function(acc, element){
                return acc + (+element["POT_BR_MW"]);
            }, 0);

            content+= " <p><b>"+this.columnLabels["POT_BR_MW"]+ " Total: </b>"+ Ext.util.Format.number(potBrut,"0.000,00/i")+"</p>";
        }

       
        var items = [{
            type: "html",
            content: content,
            newFont : {
                size: 8
            }
        }];

       

        return items;
    },

    _createPDFList : function(columns, data) {

        var bodyTemplate = new Ext.XTemplate(      
            '<li><dt><b>\{{values.firstCol.dataIndex}\}</b></dt>',
            '<dd>',
                '<ul>',
                    '<tpl for="otherColumns">',
                        '<li><i>{headerLabel}</i>: \{{dataIndex}\}</li>',                                                   
                    '</tpl>',
                '</ul>',
                '<br>',
            '</dd></li>');

        var otherColumns = columns.slice(1);
        bodyTemplate = bodyTemplate.apply({firstCol :  columns[0], otherColumns: otherColumns});
        
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

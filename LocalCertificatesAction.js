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
 * Author: Luis Román <lroman@emergya.com>
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = LocalCertificatesAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: pointInformationAction(config)
 *
 *    Provides an action for showing channel selector dialog.
 */
gxp.plugins.LocalCertificatesAction = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_localcertificates",
    
    /** i18n * */
    /** api: config[buttonText]
     *  ``String`` Text to show button
     */
    buttonText: 'Local Certificates',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for show in menu item (i18n).
     */
    menuText: 'Local Certificates',

    searchFormText: 'Show search form',
    selectInMapText: 'Select in map',
    selectPropertyInMapText: "Select a property in the map, please.",
    errorText: "An error happened, please try again in a few moments.",
    waitText: "Please wait...",


    /** api: config[tooltip]
     *  ``String``
     *  Text for channel tool tooltip (i18n).
     */
    tooltip: 'Certificados municipales',
    
    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-localcertificate-toolbar',
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.LocalCertificatesAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.LocalCertificatesAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    /** api: method[addActions]
     */
    addActions: function() {
    	
    	// FIXME: Este código es altamente tentativo.
    	if(false && !this.target.isAuthorizedIn("ROLE_ADMINISTRATOR")) {
    		// No añadimos la herramienta
    		return;
    	}


        return gxp.plugins.LocalCertificatesAction.superclass.addActions.apply(this, [{
            buttonText: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            menu: new Ext.menu.Menu({
                items: [
                    new Ext.menu.Item({
                        iconCls: "vw-icon-localcertificate-searchform-action",
                        text: this.searchFormText,
                        handler: this._showSearchFormHandler,
                        scope:this
                    }),
                    new Ext.menu.Item({
                        iconCls: "vw-icon-localcertificate-mapselection-action",
                        text: this.selectInMapText,
                        handler: this._selectInMapHandler,
                        scope: this
                    })
                ]
            }),
            scope: this
        }]);
    },

    _showSearchFormHandler : function() {
        var ds = Viewer.getComponent('LocalCertificatesWindow');
        if (ds === undefined) {
            ds = new Viewer.dialog.LocalCertificatesWindow({
               persistenceGeoContext: this.target.persistenceGeoContext,
               target: this.target,
               action: this
            });
            Viewer.registerComponent('LocalCertificatesWindow', ds);
        }
        
        if (ds.isVisible()) {
            ds.hide();
        } else {
            ds.show();
            Viewer.trackUrl('modules/CertificadosMunicipales');
        }

    },

    _selectInMapHandler : function() {
        Ext.MessageBox.alert("",this.selectPropertyInMapText)

        // We change the cursor over the map to indicate selection.
        Ext.select(".olMap").setStyle("cursor","crosshair");

        var map = Viewer.getMapPanel().map;
        var layerName = "gore:"+this.getLayerName();
        // We show the parcels layer in the map so the user can use that as reference.
        var baseLayer = new OpenLayers.Layer.WMS(
                layerName,
                app.sources.local.url+"/wms",
                {layers: layerName, outputFormat: "image/png", transparent: true,styles:"polygon"}
        );  

        
        this.addLayerIfNotExists(baseLayer);
        // We call the initial view for the user.
        app.tools.zoomToInitialValues.zoomToInitialValues();
        

        // We wait for the user's click
        map.events.register("click",this,this._onPropertySelected);    
    },

    getLayerName : function(layerType) {
        var layerPrefix = "PROPIEDAD_RURAL";
        if(typeof(layerType)!="undefined" && layerType) {
            layerPrefix = layerType;
        }

        return layerPrefix+"_"+this.getLocalityName(true).toUpperCase();
    },
        
    _onPropertySelected : function(eventData) {
            // We change back the cursor after selection.
            Ext.select(".olMap").setStyle("cursor","default");
            var map = Viewer.getMapPanel().map;
            map.events.unregister("click",this, this._onPropertySelected);

            // We get the coordinates of the clicked point in the map
            var point = map.getLonLatFromViewPortPx(eventData.xy);
            point.transform(map.projection, this._getLayerProjection());
            
            // We try to retrieve info for the lat long.
            Ext.MessageBox.wait(this.waitText);
            Ext.Ajax.request({
                url: app.sources.local.url,
                method:"GET",
                params: {
                    service: "wfs",
                    request: "GetFeature",
                    typeName : "gore:"+this.getLayerName(),
                    outputFormat: "json",
                    srsName: map.projection,
                    cql_filter: "INTERSECTS(the_geom, POINT("+point.lon+" "+point.lat+"))"              
                },

                success : function(response) {
                    var output;
                    try {
                        output = Ext.decode(response.responseText);
                    } catch(e) {
                        // Si la respuesta no es json válido hubo un fallo
                        console.debug(response.responseText);
                        Ext.MessageBox.updateProgress(1);
                        Ext.MessageBox.hide();
                        Ext.MessageBox.alert("",this.errorText);                            
                        return;
                    }                   
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();

                    if(!output.features.length) {
                        Ext.MessageBox.alert("",this.noParcelSelectedText)
                        return;
                    }

                    this.createLocalCertificate(this.processRuralProperty(output.features[0]));
   
                },

                failure: function (error) {
                    // Si la respuesta no es json válido hubo un fallo
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("",this.errorText);             
                },
                scope: this
            });
        },
        _getLayerProjection : function () {
            // FIXME: This should be retrieved from the server...
            return  "EPSG:32719";
        },

        createLocalCertificate : function(ruralData) {
            var resultLabel = this.getCertificateLabel(ruralData,"_");
            
            
            var localityName =this.getLocalityName(false);
            
            var gjson = new OpenLayers.Format.GeoJSON();
            var geometry = gjson.parseGeometry(ruralData.geom);
            var self = this;

            Ext.MessageBox.wait(this.waitText);

            // Here we will write down the results of each ajax request.
            this.pdfData = {
                localityName : localityName,
                resultLabel: resultLabel,
                ruralData : ruralData,
                mapImageData: null,
                blockData : null,
                zoneData : null
            }

            
            this.retrievePDFImage(ruralData.OBJECTID, geometry);

            var centroid = geometry.getCentroid();
            centroid.transform(Viewer.getMapPanel().map.projection, this._getLayerProjection());
            this.retrievePDFBlockData(centroid);
            this.retrievePDFZoneData(centroid);

            this.retri
        },

        retrievePDFBlockData : function (ruralPropertyCentroid) {
            Ext.Ajax.request({
                url: app.sources.local.url,
                method:"GET",
                params: {
                    service: "wfs",
                    request: "GetFeature",
                    typeName : "gore:"+this.getLayerName("MANZANAS"),
                    outputFormat: "json",
                    srsName: Viewer.getMapPanel().map.projection,
                    cql_filter: "INTERSECTS(the_geom, POINT("+ruralPropertyCentroid.x+" "+ruralPropertyCentroid.y+"))"              
                },

                success : function(response) {
                    var output;
                    try {
                        output = Ext.decode(response.responseText);
                    } catch(e) {
                        // Si la respuesta no es json válido hubo un fallo
                        Ext.MessageBox.updateProgress(1);
                        Ext.MessageBox.hide();
                        Ext.MessageBox.alert("",this.errorText);                            
                        return;
                    }       

                    if(!output.features.length) {
                        this.pdfData.blockData = {
                            blockNumber:null
                        };
                    } else {
                        this.pdfData.blockData= {
                            blockNumber: output.features[0].properties["N°_MANZANA"]
                        };
                    }

                    
                    this.doLocalCertificateCreation();
   
                },

                failure: function (error) {
                    // Si la respuesta no es json válido hubo un fallo
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("",this.errorText);             
                },
                scope: this
            });
        },

        retrievePDFZoneData : function (ruralPropertyCentroid) {
            Ext.Ajax.request({
                url: app.sources.local.url,
                method:"GET",
                params: {
                    service: "wfs",
                    request: "GetFeature",
                    typeName : "gore:"+this.getLayerName("ZONIFICACION"),
                    outputFormat: "json",
                    srsName: Viewer.getMapPanel().map.projection,
                    cql_filter: "INTERSECTS(the_geom, POINT("+ruralPropertyCentroid.x+" "+ruralPropertyCentroid.y+"))"              
                },

                success : function(response) {
                    var output;
                    try {
                        output = Ext.decode(response.responseText);
                    } catch(e) {
                        // Si la respuesta no es json válido hubo un fallo
                        Ext.MessageBox.updateProgress(1);
                        Ext.MessageBox.hide();
                        Ext.MessageBox.alert("",this.errorText);                            
                        return;
                    }       

                    if(!output.features.length) {
                        this.pdfData.zoneData = {zoneNumber:null, zoneDescription:null};
                    } else {                        
                        this.pdfData.zoneData = {
                            zoneNumber:  output.features[0].properties["ZONA"],
                            zoneDescription: output.features[0].properties["DESCRIPCION"]
                        } 
                    }

                    
                    this.doLocalCertificateCreation();
   
                },

                failure: function (error) {
                    // Si la respuesta no es json válido hubo un fallo
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("",this.errorText);             
                },
                scope: this
            });
        },

        doLocalCertificateCreation : function() {
            // First we check if we have finished retrieving all ajax data.
            if(!this.pdfData.mapImageData || !this.pdfData.blockData || !this.pdfData.zoneData) {
                // We havent finished the retrieval of all data so we cannot continue.
                return;
            }

            var pdfDoc= new jsPDF("p","mm","letter");
            this.createPDFDocument(pdfDoc, this.pdfData);
            var fileName = "certificado_municipal_"+this.pdfData.resultLabel+".pdf";
            
            
            var uristring = pdfDoc.output("datauristring");
            this.downloadDataURI({
                filename : fileName,
                data: uristring,
                contentType:"application/pdf"
            });     
            Ext.MessageBox.hide();
        },

        
        downloadDataURI : function(options){
            // Localhost will work because the request is done actually by the proxy.
            var form = $('<form method="POST" action="'+app.proxy+'http://localhost/downloadURI/downloadURI.php">'
                    +'<input type="text" name="filename" value="'+options.filename
                    +'"/><input type="text" name="data" value="'+options.data
                    +'"/><input type="text" name="contentType" value="'+options.contentType
                    +'"/><button type="submit"/>')[0];
            var body = $("body")[0];
            body.appendChild(form);
            form.submit();                              
        },
        
        
        
        retrievePDFImage : function(objectid, geometry) {
            var bounds = geometry.getBounds();
            // We add a bit of padding to the bounds so we show a bit of 
            // context in the map.
            var padding = 25;
            bounds.top +=padding;
            bounds.left-=padding;
            bounds.bottom-=padding;
            bounds.right+=padding;
            var mapUrl = this._createURL(
                    app.sources.local.url.replace("ows","wms"), {
                    service:"WMS",
                    version: "1.1.0",
                    request:"GetMap",
                    layers:"gore:"+this.getLayerName(),
                    width:400,
                    height:300,
                    bbox: bounds,
                    srs : Viewer.getMapPanel().map.projection,
                    format:"image/png",
                    styles:"polygon"
                });
        
            var parcelUrl = this._createURL(
                    app.sources.local.url.replace("ows","wms"), {
                        service:"WMS",
                        version: "1.1.0",
                        request:"GetMap",
                        layers:"gore:"+this.getLayerName(),
                        width:400,
                        height:300,
                        bbox: bounds,
                        srs : Viewer.getMapPanel().map.projection,
                        format:"image/png",
                        transparent:true,
                        cql_filter: encodeURIComponent("OBJECTID = "+objectid)
                    });
            
        
            // No problem using localhost here as the url will be 
            // called by the proxy actually.
            Ext.Ajax.request({
                url:'http://localhost/ImageURIGen/urigen.php',
                method:"POST",              
                params:{
                    params:Ext.encode({
                        outputFormat:"jpeg",
                        combine:true,
                        outputWidth:400,
                        outputHeight:300,
                        images:[mapUrl, parcelUrl]
                    })
                },
                success: function(response) {
                    response = Ext.decode(response.responseText);
                    // We have the map data so we try creating the certificate.
                    this.pdfData.mapImageData = response.data[0].uri;
                    this.doLocalCertificateCreation();          
                },
                failure : function(response) {
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("",this.errorText); 
                },
                scope:this
            });
        },

        createPDFDocument : function(pdfDoc,pdfData) {
            
            var pageWidth = pdfDoc.internal.pageSize.width;
            var margin = 30;
            var avalaibleWidth = pageWidth-2*margin;
            
            pdfDoc.setLineWidth(0.01);
            
            pdfDoc.setFontSize(10);
            pdfDoc.text(margin,margin,"LOGO DEL MUNICIPIO");            
            
            pdfDoc.setFontSize(12);
            pdfDoc.setFontType("bold");
            this.renderCenteredText(pdfDoc, margin,margin+10,"MUNICIPALIDAD DE "+pdfData.localityName.toUpperCase());
            
            pdfDoc.setFontSize(9);
            this.renderCenteredText(pdfDoc, margin,margin+15,"NOMBRE DEL CERTIFICADO (AÚN NO DEFINIDO)");           
            
            pdfDoc.setFontType("normal");           
            pdfDoc.text(margin, margin+25, "NOMBRE DEL DEPTO RESPONSABLE DE ESTA INFORMACIÓN (MUNICIPIO LO DEBE DEFINIR)");
            
            pdfDoc.setFontType("bold");
            pdfDoc.text(margin, margin+45, "RESULTADO DE LA BÚSQUEDA:");
            
            pdfDoc.setFontType("normal");
            var endPos=this.createPDFTable(pdfDoc, margin,margin+50, [0.3,0.7],[
                       ["ROL", pdfData.ruralData.ROL?pdfData.ruralData.ROL:"Falta en capa"],
                       ["DIRECCIÓN", this.getPDFValue(pdfData.ruralData.DIRECCION)],
                       ["Nº MANZANA",this.getPDFValue(pdfData.blockData.blockNumber)],
                       ["SUPERFICIE",this.getPDFValue(pdfData.ruralData.SUPERFIFICE)]]);        
    
            endPos = this.createPDFTable(pdfDoc,margin, endPos+10, [0.3, 0.7],[
                   ["NOMBRE PROPIETARIO", this.getPDFValue(pdfData.ruralData.PROPIETARI)]]);
            
            endPos = this.createPDFTable(pdfDoc,margin, endPos+10, [0.3, 0.7],[
                    [{content:"ZONIFICACIÓN", rowspan:2}, this.getPDFValue(pdfData.zoneData.zoneNumber)],
                    [null, this.getPDFValue(pdfData.zoneData.zoneDescription)]]);
            
            endPos+=10;
            endPos =this.renderCenteredImage(pdfDoc,pageWidth, endPos, avalaibleWidth*.7, pdfData.mapImageData);            
            
            pdfDoc.setFontSize(7);      
            pdfDoc.setFontType("bold");
            this.renderCenteredText(pdfDoc,margin, endPos+10, "AQUÍ DEBIERAN IR LOS DATOS DE CONTACTO DEL MUNCIPIO (DEPTO/FONO/CORREO/ETC)");
            this.renderCenteredText(pdfDoc,margin, endPos+14, "ADEMÁS DE DATOS DE LA PLATAFORMA DEL SIR");      
            
        },

        getPDFValue : function(value) {
            if(typeof(value) == "undefined" || !value) {
                return "Sin información";
            } else {
                return value;
            }
        },

        
        renderCenteredImage : function(pdfDoc, pageWidth, endPos, imageWidth, mapImageData) {
            
            var left = pageWidth/2 - imageWidth/2;
            var imageHeight = imageWidth*3/4;
            pdfDoc.addImage(mapImageData,"JPEG",left,endPos,imageWidth,imageHeight);
            
            return endPos+imageHeight;
        },
        
        renderCenteredText : function(pdfDoc, margin, topPos, text) {       
            
            var pageWidth = pdfDoc.internal.pageSize.width;
            var centerLeft = pageWidth/2;           
            // Dividido entre este factor para obtener mm.
            var mmToPFactor= 72/25.6;
            var textLength = pdfDoc.internal.getFontSize()* pdfDoc.getStringUnitWidth(text)/mmToPFactor;
            pdfDoc.text(centerLeft-textLength/2,topPos, text);          
        },
        
        createPDFTable : function(pdfDoc, marginLeft, topPos, columnSizes, rows) {
            var rowHeight=5;
            var avalaibleWidth= pdfDoc.internal.pageSize.width - marginLeft*2;
            var cellPadding =1.3;
            for(var rowIdx=0; rowIdx<rows.length; rowIdx++) {
                var row = rows[rowIdx];
                
                var cellCount = row.length;
            
                var cellLeft = marginLeft;
                for(var cellIdx=0; cellIdx< row.length; cellIdx++) {
                    var cellWidth = columnSizes[cellIdx];
                    if(cellWidth<1) {
                        // A percentual width.
                        cellWidth = cellWidth* avalaibleWidth;
                    }                   
                    
                    var cell = row[cellIdx];
                    
                    var rowspan = 1;
                    var colspan = 1;
                    if(cell) {          
                        var text = cell;
                        if(!Ext.isString(cell)) {
                            text = cell.content;
                            if(cell.rowspan) {
                                rowspan = cell.rowspan;
                            }
                            
                            if(cell.colspan) {
                                colspan = cell.colspan;
                            }
                        } 
                        
                        pdfDoc.rect(cellLeft, topPos, cellWidth*colspan, rowHeight*rowspan);
                        pdfDoc.text(cellLeft+cellPadding, topPos+rowHeight-cellPadding, text);
                    } 
                    
                                        
                    cellLeft+= cellWidth*colspan;
                }
                
                
                topPos+=rowHeight;
            }
            
            return topPos;
        },

        getLocalityName : function(tidy) {
            // TODO: Esto depende del usuario municipal que esté logeado.           
            var result =  "Machalí";
            if(tidy) {
                result = this._accentsTidy(result);
            }
            return result;
        },
        
        _accentsTidy  :  function(s){
            var r=s.toLowerCase();
            r = r.replace(new RegExp("\\s", 'g'),"");
            r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
            r = r.replace(new RegExp("æ", 'g'),"ae");
            r = r.replace(new RegExp("ç", 'g'),"c");
            r = r.replace(new RegExp("[èéêë]", 'g'),"e");
            r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
            r = r.replace(new RegExp("ñ", 'g'),"n");                            
            r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
            r = r.replace(new RegExp("œ", 'g'),"oe");
            r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
            r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
            r = r.replace(new RegExp("\\W", 'g'),"");
            return r;
        },

        // Adds a layer only if there isn't a layer of the same name in the layer list to avoid duplicates.
        addLayerIfNotExists : function(newLayer) {
            var map = Viewer.getMapPanel().map;
            
            var existingLayer =null;
            for(var idx=0; idx < map.layers.length; idx++) {
                if(map.layers[idx].name == newLayer.name ) {
                    existingLayer =map.layers[idx];
                    break;
                }
            }

            if(!existingLayer) {
                // We add the new layer.
                map.addLayer(newLayer); 
            } else {
                // We show an existing layer.
                existingLayer.display(true);
            }
        },

        processRuralProperty : function(result) {
            result.properties.geom = result.geometry;
            return result.properties;
        },

        getCertificateLabel : function(data, separator) {
            var pieces = [];
            if(data.ROL) {
                pieces.push(data.ROL);
            }

            if(data.PROPIETARI) {
                pieces.push(data.PROPIETARI);
            }

            if(data.NOM_PREDIO) {
                pieces.push(data.NOM_PREDIO);
            }

            if(data.OBJECTID) {
                pieces.push(data.OBJECTID);
            }

            return pieces.join(separator);
        },

        _createURL : function(baseUrl, params) {
            var url = baseUrl+"?";
            var paramPieces = [];
            for(var key in params) {
                paramPieces.push(key+"="+params[key]);
            }           
            return url+paramPieces.join("&");
        }

});

Ext.preg(gxp.plugins.LocalCertificatesAction.prototype.ptype, gxp.plugins.LocalCertificatesAction);

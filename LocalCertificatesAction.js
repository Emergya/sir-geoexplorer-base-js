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
Ext.namespace('gxp.plugins');

/** api: constructor
 *  .. class:: pointInformationAction(config)
 *
 *    Provides actions for generating certificates for properties in a given localty.
 */
gxp.plugins.LocalCertificatesAction = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = gxp_extendedtoolbar */
    ptype: 'gxp_localcertificates',

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

    /** api: config[pdfLogoUri]
     * The url or data uri containing the logo shown in the local certificate pdf.
     */
    pdfLogoUri : null,

    /** api: config[selectedParcelStyleName]
     * The style of the parcel the certificate is made for.
     */
    selectedParcelStyleName : "polygon",

    searchFormText: 'Show search form',
    selectInMapText: 'Select in map',
    selectPropertyInMapText: 'Select a property in the map, please.',
    errorText: 'An error happened, please try again in a few moments.',
    waitText: 'Please wait...',
    footerLine1Text: 'Gobierno Regional Región Del Libertador General Bernardo O\'Higgins',
    footerLine2Text: 'Plaza de Los Héroes s/n. Rancagua. Fono (72)2-205900 - Fax (72)2-237148',





    /** api: config[tooltip]
     *  ``String``
     *  Text for channel tool tooltip (i18n).
     */
    tooltip: 'Local Certificates',

    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-localcertificate-toolbar',

    _toolItems: null,

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

        app.on('loginstatechange', this._onLoginStateChanged, this);

        app.on("ready", this._composerReady, this);

        var hidden = this._checkHidden(app.persistenceGeoContext.userInfo);
        return this._toolItems = gxp.plugins.LocalCertificatesAction.superclass.addActions.apply(this, [{
            buttonText: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            hidden: hidden,
            disabled: true,
            menu: new Ext.menu.Menu({
                items: [
                new Ext.menu.Item({
                    iconCls: 'vw-icon-localcertificate-searchform-action',
                    text: this.searchFormText,
                    handler: this._showSearchFormHandler,
                    scope: this
                }),
                new Ext.menu.Item({
                    iconCls: 'vw-icon-mapselection',
                    text: this.selectInMapText,
                    handler: this._selectInMapHandler,
                    scope: this
                })]
            }),
            scope: this
        }]);


    },

    _composerReady : function() {
        this._toolItems[0].enable();
    },

    _onLoginStateChanged: function(sender, userInfo) {
        var hidden = this._checkHidden(userInfo);
        var toolButton = this._toolItems[0];
        if (hidden) {

            // We destroy the search form
            var ds = Viewer.getComponent('LocalCertificatesWindow');
            if (ds) {
                Viewer.unregisterComponent('LocalCertificatesWindow');
                ds.destroy();
            }


            this._cancelMapSelection();


            toolButton.hide();
        } else {
            toolButton.show();
        }
    },

    _checkHidden: function(userInfo) {
        if (!userInfo || userInfo.admin || !userInfo.authority || userInfo.authority.indexOf('Municipalidad') == -1) {
            return true;
        }

        return false;
    },

    _showSearchFormHandler: function() {
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

            this._cancelMapSelection();
            ds.show();
        }

    },

    _cancelMapSelection: function() {
        // We change the cursor over the map to indicate selection.
        Ext.select('.olMap').setStyle('cursor', 'default');
        var map = Viewer.getMapPanel().map;
        map.events.unregister('click', this, this._onPropertySelected);
    },

    _selectInMapHandler: function() {
        Ext.MessageBox.alert('', this.selectPropertyInMapText);

        // We change the cursor over the map to indicate selection.
        Ext.select('.olMap').setStyle('cursor', 'crosshair');

        this.addLocalityLayer();

        // We call the initial view for the user.
        app.tools.zoomToInitialValues.zoomToInitialValues();

         var map = Viewer.getMapPanel().map;
        // We wait for the user's click
        map.events.register('click', this, this._onPropertySelected);
    },

    addLocalityLayer: function() {
         var map = Viewer.getMapPanel().map;
        var layerName = 'gore:' + this.getLayerName();
        // We show the parcels layer in the map so the user can use that as reference.
        var baseLayer = new OpenLayers.Layer.WMS(
            'Propiedad Rural ' + this.getLocalityName(false),
            app.sources.local.url + '/wms', {
            layers: layerName,
            outputFormat: 'image/png',
            transparent: true,
            styles: 'Borde_comuna'
        });


        this.addLayerIfNotExists(baseLayer);
    },

    getLayerName: function(layerType) {
        var layerPrefix = 'PROPIEDAD_RURAL';
        if (typeof(layerType) != 'undefined' && layerType) {
            layerPrefix = layerType;
        }

        var localityName = this.getLocalityName(true).toUpperCase();

        if (!localityName) {
            return null;
        }

        return layerPrefix + '_' + localityName;
    },

    _onPropertySelected: function(eventData) {
        // We change back the cursor after selection.
        Ext.select('.olMap').setStyle('cursor', 'default');
        var map = Viewer.getMapPanel().map;
        map.events.unregister('click', this, this._onPropertySelected);

        // We get the coordinates of the clicked point in the map
        var point = map.getLonLatFromViewPortPx(eventData.xy);
        point.transform(map.projection, this._getLayerProjection());

        // We try to retrieve info for the lat long.
        Ext.MessageBox.wait(this.waitText);
        Ext.Ajax.request({
            url: app.sources.local.url,
            method: 'GET',
            params: {
                service: 'WFS',
                request: 'GetFeature',
                typeName: 'gore:' + this.getLayerName(),
                outputFormat: 'json',
                srsName: map.projection,
                cql_filter: 'INTERSECTS(the_geom, POINT(' + point.lon + ' ' + point.lat + '))'
            },

            success: function(response) {
                var output;
                try {
                    output = Ext.decode(response.responseText);
                } catch (e) {
                    // If we can't decode the response's json then the server outputted
                    // the error in xml.
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert('', this.errorText);
                    return;
                }
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();

                if (!output.features.length) {
                    Ext.MessageBox.alert('', this.noParcelSelectedText);
                    return;
                }

                this.createLocalCertificate(this.processRuralProperty(output.features[0]));

            },

            failure: function(error) {
                // Si la respuesta no es json válido hubo un fallo
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                Ext.MessageBox.alert('', this.errorText);
            },
            scope: this
        });
    },
    _getLayerProjection: function() {
        // FIXME: This should be retrieved from the server...
        return 'EPSG:32719';
    },

    createLocalCertificate: function(ruralData) {
        var resultLabel = this.getCertificateLabel(ruralData, '_');


        var localityName = this.getLocalityName(false);

        var gjson = new OpenLayers.Format.GeoJSON();
        var geometry = gjson.parseGeometry(ruralData.geom);
        var self = this;

        Ext.MessageBox.wait(this.waitText);

        // Here we will write down the results of each ajax request.
        this.pdfData = {
            localityName: localityName,
            resultLabel: resultLabel,
            ruralData: ruralData,
            mapImageUrls: this._createMapImageURLs(ruralData.OBJECTID, geometry),
            blockData: null,
            zoneData: null
        };

        // We calculate the centroid of the data, to pass it ass query for the other data.
        var centroid = geometry.getCentroid();
        centroid.transform(Viewer.getMapPanel().map.projection, this._getLayerProjection());
        this._retrievePDFBlockData(centroid);
        this._retrievePDFZoneData(centroid);
    },

    _retrievePDFBlockData: function(ruralPropertyCentroid) {
        Ext.Ajax.request({
            url: app.sources.local.url,
            method: 'GET',
            params: {
                service: 'WFS',
                request: 'GetFeature',
                typeName: 'gore:' + this.getLayerName('MANZANAS'),
                outputFormat: 'json',
                srsName: Viewer.getMapPanel().map.projection,
                cql_filter: 'INTERSECTS(the_geom, POINT(' + ruralPropertyCentroid.x + ' ' + ruralPropertyCentroid.y + '))'
            },

            success: function(response) {
                var output;
                try {
                    output = Ext.decode(response.responseText);
                } catch (e) {
                    // Si la respuesta no es json válido hubo un fallo
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert('', this.errorText);
                    return;
                }

                if (!output.features.length) {
                    this.pdfData.blockData = {
                        blockNumber: null
                    };
                } else {
                    this.pdfData.blockData = {
                        blockNumber: output.features[0].properties['N_MANZANA']
                    };
                }


                this._doLocalCertificateCreation();

            },

            failure: function(error) {
                // Si la respuesta no es json válido hubo un fallo
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                Ext.MessageBox.alert('', this.errorText);
            },
            scope: this
        });
    },

    _retrievePDFZoneData: function(ruralPropertyCentroid) {
        Ext.Ajax.request({
            url: app.sources.local.url,
            method: 'GET',
            params: {
                service: 'WFS',
                request: 'GetFeature',
                typeName: 'gore:' + this.getLayerName('ZONIFICACION'),
                outputFormat: 'json',
                srsName: Viewer.getMapPanel().map.projection,
                cql_filter: 'INTERSECTS(the_geom, POINT(' + ruralPropertyCentroid.x + ' ' + ruralPropertyCentroid.y + '))'
            },

            success: function(response) {
                var output;
                try {
                    output = Ext.decode(response.responseText);
                } catch (e) {
                    // Si la respuesta no es json válido hubo un fallo
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert('', this.errorText);
                    return;
                }

                if (!output.features.length) {
                    this.pdfData.zoneData = {
                        zoneNumber: null,
                        zoneDescription: null
                    };
                } else {
                    this.pdfData.zoneData = {
                        zoneNumber: output.features[0].properties['ZONA'],
                        zoneDescription: output.features[0].properties['DESCRIPCION']
                    };
                }


                this._doLocalCertificateCreation();

            },

            failure: function(error) {
                // Si la respuesta no es json válido hubo un fallo
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                Ext.MessageBox.alert('', this.errorText);
            },
            scope: this
        });
    },

    _doLocalCertificateCreation: function() {
        // First we check if we have finished retrieving all ajax data.
        if (!this.pdfData.blockData || !this.pdfData.zoneData) {
            // We havent finished the retrieval of all data so we cannot continue.
            return;
        }

        var params = {
            size: 'letter',
            margin: {
                top: 20, // mm
                bottom: 30,
                left: 30,
                right: 30
            },
            title: 'Certificado Municipal',
            items: this.createPDFDocument(this.pdfData),
            outputFile: 'certificado_municipal_' + this.pdfData.resultLabel.replace(/ /g, '_'),
            keepFile: true
        };

        var url = app.proxy + 'http://localhost/phpPDF/phpPDF.php';

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

                var result="";
                try {
                    result = Ext.decode(response.responseText);
                } catch(e) {
                    // An error creating the file.
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert('', this.errorText);
                    return;
                }

                if(result.error) {
                    // An error creating the file.
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert('', this.errorText);
                    return;
                }

                // We can use localhost this way because of the proxy
                app.downloadFile(url, {
                    params: Ext.encode({
                        downloadFile: result.downloadableFile,
                        outputFormat: 'PDF'
                    })
                });
            },
            failure: function(response) {
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                Ext.MessageBox.alert('', this.errorText);
            },
            scope: this
        });


    },


    _createMapImageURLs: function(objectid, geometry) {
        var bounds = geometry.getBounds();

        var bboundsW = bounds.right - bounds.left;
        var bboundsH = bounds.top - bounds.bottom;

        var padding = 200;
        var proportion = 800 / 600;

        var newBBoxW = proportion * bboundsH;
        var bboxHCenter = (bounds.right + bounds.left) / 2;

        var paddingH = padding * proportion + newBBoxW / 2;
        // We add a bit of padding to the bounds so we show a bit of
        // context in the map.
        bounds.top += padding;
        bounds.left = bboxHCenter - paddingH;
        bounds.bottom -= padding;
        bounds.right = bboxHCenter + paddingH;

        var urls = {
            baseLayerUrl: this._createURL(
                'http://localhost/osmWMS/osmWMS.php', {
                REQUEST: 'GetMap',
                WIDTH: 800,
                HEIGHT: 600,
                BBOX: bounds,
                FORMAT: 'image/png'
            }),
            mapUrl: this._createURL(
            app.sources.local.url.replace('ows', 'wms'), {
                service: 'WMS',
                version: '1.1.0',
                request: 'GetMap',
                layers: 'gore:' + this.getLayerName(),
                width: 800,
                height: 600,
                bbox: bounds,
                srs: Viewer.getMapPanel().map.projection,
                format: 'image/png',
                transparent: true,
                styles: 'Borde_comuna'
            }),
            parcelUrl: this._createURL(
            app.sources.local.url.replace('ows', 'wms'), {
                service: 'WMS',
                version: '1.1.0',
                request: 'GetMap',
                layers: 'gore:' + this.getLayerName(),
                width: 800,
                height: 600,
                bbox: bounds,
                srs: Viewer.getMapPanel().map.projection,
                format: 'image/png',
                transparent: true,
                opacity: 0.5,
                styles: this.selectedParcelStyleName,
                cql_filter: encodeURIComponent('OBJECTID = ' + objectid)
            })

        };

        return urls;
    },

    createPDFDocument: function(pdfData) {
        var pageWidth = 215.9;
        var margin = 30;
        var avalaibleWidth = pageWidth - 2 * margin;

        var leftColumnWidth = avalaibleWidth * 0.3;
        var rightColumnWidth = avalaibleWidth * 0.7;

        var roleText = pdfData.ruralData.ROL ? pdfData.ruralData.ROL : 'Falta en capa';

        var items = [];
        if(this.pdfLogoUri) {
            items.push({
            type: "image",
            width: 22,
            url: this.pdfLogoUri
         });
        }
        items.push({
            newFont: {
                size: 12,
                style: 'B'
            },
            text: 'MUNICIPALIDAD DE ' + pdfData.localityName.toUpperCase(),
            align: 'C',
            dy: 1
        }, {
            newFont: {
                size: 9
            },
            text: 'CERTIFICADO MUNICIPAL',
            align: 'C',
            dy: 3
        }, {
            newFont: {
                style: ''
            },
            dy: 7,
            text: ''
        }, {
            newFont: {
                style: 'B'
            },
            text: 'RESULTADO DE LA BÚSQUEDA:',
            dy: 15
        }, {
            newFont: {
                style: ''
            },
            newLineWidth: 0.1,
            type: 'table',
            rows: [
                [{
                    text: 'ROL',
                    width: leftColumnWidth
                }, {
                    text: roleText,
                    width: rightColumnWidth
                }],
                ['DIRECCIÓN', this._getPDFValue(pdfData.ruralData.DIRECCION)],
                ['Nº MANZANA', this._getPDFValue(pdfData.blockData.blockNumber)],
                ['SUPERFICIE', this._getPDFValue(pdfData.ruralData.SUPERFIFICE)]
            ],
            dy: 5
        }, {
            type: 'table',
            rows: [
                [{
                    text: 'NOMBRE PROPIETARIO',
                    width: leftColumnWidth
                }, {
                    text: this._getPDFValue(pdfData.ruralData.PROPIETARI),
                    width: rightColumnWidth
                }]
            ],
            dy: 10
        }, {
            type: 'table',
            rows: [
                [{
                    text: 'ZONIFICACIÓN',
                    width: leftColumnWidth,
                    rowspan: 2
                }, {
                    text: this._getPDFValue(pdfData.zoneData.zoneNumber),
                    width: rightColumnWidth
                }],
                [this._getPDFValue(pdfData.zoneData.zoneDescription)]
            ],
            dy: 10
        }, {
            type: 'image',
            url: pdfData.mapImageUrls.baseLayerUrl,
            width: avalaibleWidth * 0.7,
            dx: Math.floor(avalaibleWidth * 0.15), // So the image is centered.
            dy: 7,
            keepPosition: true,
            dpi: 300
        }, {
            type: 'image',
            url: pdfData.mapImageUrls.mapUrl,
            width: avalaibleWidth * 0.7,
            keepPosition: true
        }, {
            type: 'image',
            url: pdfData.mapImageUrls.parcelUrl,
            width: avalaibleWidth * 0.7
        }, {
            newFont: {
                size: 7,
                style: 'B'
            },
            text: this.footerLine1Text,
            align: 'C',
            x: margin,
            dy: 7
        }, {
            text: this.footerLine2Text,
            align: 'C',
            dy: 1
        });

        return items;
    },

    _getPDFValue: function(value) {
        if (typeof(value) == 'undefined' || !value) {
            return 'Sin información';
        } else {
            return value;
        }
    },


    getLocalityName: function(tidy) {

        if (!app.persistenceGeoContext.userInfo) {
            return '';
        }

        var authority = app.persistenceGeoContext.userInfo.authority;
        var needle = 'Municipalidad de';
        var localityName = authority.substr(authority.indexOf(needle) + needle.length);
        if (tidy) {
            localityName = this._accentsTidy(localityName);
        }
        return localityName;
    },

    _accentsTidy: function(s) {
        var r = s.toLowerCase();
        r = r.replace(new RegExp('\\s', 'g'), '');
        r = r.replace(new RegExp('[àáâãäå]', 'g'), 'a');
        r = r.replace(new RegExp('æ', 'g'), 'ae');
        r = r.replace(new RegExp('ç', 'g'), 'c');
        r = r.replace(new RegExp('[èéêë]', 'g'), 'e');
        r = r.replace(new RegExp('[ìíîï]', 'g'), 'i');
        r = r.replace(new RegExp('ñ', 'g'), 'n');
        r = r.replace(new RegExp('[òóôõö]', 'g'), 'o');
        r = r.replace(new RegExp('œ', 'g'), 'oe');
        r = r.replace(new RegExp('[ùúûü]', 'g'), 'u');
        r = r.replace(new RegExp('[ýÿ]', 'g'), 'y');
        r = r.replace(new RegExp('\\W', 'g'), '');
        return r;
    },

    // Adds a layer only if there isn't a layer of the same name in the layer list to avoid duplicates.
    addLayerIfNotExists: function(newLayer) {
        var map = Viewer.getMapPanel().map;

        var existingLayer = null;
        for (var idx = 0; idx < map.layers.length; idx++) {
            if (map.layers[idx].name == newLayer.name) {
                existingLayer = map.layers[idx];
                break;
            }
        }

        if (!existingLayer) {
            // We add the new layer.
            map.addLayer(newLayer);
        } else {
            // We show an existing layer.
            existingLayer.display(true);
        }
    },

    processRuralProperty: function(result) {
        result.properties.geom = result.geometry;
        return result.properties;
    },

    getCertificateLabel: function(data, separator) {
        var pieces = [];
        if (data.ROL) {
            pieces.push(data.ROL);
        }

        if (data.PROPIETARI) {
            pieces.push(data.PROPIETARI);
        }

        if (data.NOM_PREDIO) {
            pieces.push(data.NOM_PREDIO);
        }

        if (data.OBJECTID) {
            pieces.push(data.OBJECTID);
        }

        return pieces.join(separator);
    },

    _createURL: function(baseUrl, params) {
        var url = baseUrl + '?';
        var paramPieces = [];
        for (var key in params) {
            paramPieces.push(key + '=' + params[key]);
        }
        return url + paramPieces.join('&');
    }

});

Ext.preg(gxp.plugins.LocalCertificatesAction.prototype.ptype, gxp.plugins.LocalCertificatesAction);

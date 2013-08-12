/**
 * Copyright (C) 2012
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
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = WMSGetFeatureInfoAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: WMSGetFeatureInfo(config)
 */
Viewer.plugins.WMSGetFeatureInfoAction = Ext.extend(gxp.plugins.WMSGetFeatureInfo, {

    ptype: 'vw_wmsgetfeatureinfo',

    featureInfoDialog: null,

    init: function(target) {
        Viewer.plugins.WMSGetFeatureInfoAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    addActions: function() {

        this.featureInfoDialog = new Viewer.dialog.WMSGetFeatureInfo({
            mapPanel: this.target.mapPanel,
            map: this.target.mapPanel.map
        });
        
        var actions = gxp.plugins.WMSGetFeatureInfo.superclass.addActions.call(this, [{
            tooltip: this.infoActionTip,
            iconCls: "gxp-icon-getfeatureinfo",
            buttonText: this.buttonText,
            toggleGroup: this.toggleGroup,
            enableToggle: true,
            allowDepress: true,
            toggleHandler: function(button, pressed) {
                for (var i = 0, len = info.controls.length; i < len; i++){
                    var control = info.controls[i];
                    if (pressed) {
                        Ext.select(".olMap").setStyle("cursor", "crosshair");
                        control.activate();
                    } else {
                        Ext.select(".olMap").setStyle("cursor", "default");
                        control.deactivate();
                        this.featureInfoDialog.hide();
                    }
                }
             }.createDelegate(this)
        }]);

        var infoButton = this.actions[0].items[0];

        infoButton.setDisabled(true);

        app.on('ready',function(){
            infoButton.setDisabled(false);
        });

        var info = {controls: []};

        var updateInfo = function() {

            var queryableLayers = this.target.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
                var layer = x.get('layer');
                var queryable = (layer.CLASS_NAME == 'OpenLayers.Layer.WMS'
                    || layer.CLASS_NAME == 'OpenLayers.Layer.WFS')
                    && layer.visibility === true;
                return queryable;
            });

            var map = this.target.mapPanel.map;

            for (var i = 0, len = info.controls.length; i < len; i++){
                var control = info.controls[i];
                map.removeControl(control);
                control.deactivate(); // TODO: remove when http://trac.openlayers.org/ticket/2130 is closed
                control.destroy();
            }

            info.controls = [];

            queryableLayers.each(function(x){

                var layer = x.getLayer();
                var vendorParams = Ext.apply({}, this.vendorParams), param;

                if (this.layerParams) {
                    for (var i=this.layerParams.length-1; i>=0; --i) {
                        param = this.layerParams[i].toUpperCase();
                        vendorParams[param] = layer.params[param];
                    }
                }

                var infoFormat = x.get("infoFormat");
                if (infoFormat === undefined) {
                    // TODO: check if chosen format exists in infoFormats array
                    // TODO: this will not work for WMS 1.3 (text/xml instead for GML)
                    infoFormat = this.format == "html" ? "text/html" : "application/vnd.ogc.gml";
                }

                var control = new OpenLayers.Control.WMSGetFeatureInfo(Ext.applyIf({
                    url: layer.url,
                    queryVisible: true,
                    layers: [layer],
                    infoFormat: infoFormat,
                    vendorParams: vendorParams,
                    eventListeners: {
                        getfeatureinfo: function(evt) {
                            var title = x.get("title") || x.get("name");
                            if (infoFormat == "text/html") {
                                var match = evt.text.match(/<body[^>]*>([\s\S]*)<\/body>/);
                                if (match && !match[1].match(/^\s*$/)) {
                                    this.displayPopup(evt, title, match[1]);
                                }
                            } else if (infoFormat == "text/plain") {
                                this.displayPopup(evt, title, '<pre>' + evt.text + '</pre>');
                            } else if (evt.features && evt.features.length > 0) {
                                this.displayPopup(evt, title, null, x.get("getFeatureInfo"));
                            }
                        },
                        scope: this
                    }
                }, this.controlOptions));

                info.controls.push(control);
                map.addControl(control);

                if (infoButton.pressed) {
                    control.activate();
                }
            }, this);

        }.createDelegate(this);

        updateInfo();
        
        this.target.mapPanel.layers.on("update", updateInfo, this);
        this.target.mapPanel.layers.on("add", updateInfo, this);
        this.target.mapPanel.layers.on("remove", updateInfo, this);
        
        return actions;
    },

    displayPopup: function(evt, title, text, featureInfo) {

        this.featureInfoDialog.addInfoToLayer(evt.object.layers[0], {
            evt: evt,
            title: title,
            text: text,
            featureInfo: featureInfo
        });

        this.featureInfoDialog.refreshFeatureInfo();
    }
});

Ext.preg(Viewer.plugins.WMSGetFeatureInfoAction.prototype.ptype, Viewer.plugins.WMSGetFeatureInfoAction);

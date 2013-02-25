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

(function() {

Viewer.dialog.PlanificationToolsRulesWindow = Ext.extend(Ext.Window, {

    rulesTabs: null,

    constructor: function(config) {

        config = config || {};

        Viewer.dialog.PlanificationToolsRulesWindow.superclass.constructor.call(this, Ext.apply({
            title: 'Leyenda de IPT',
            width: 240,
            height: 400,
            layout: 'fit',
            closeAction: 'hide'
        }, config));

        this.on({
            beforerender: this.onBeforeRender,
            scope: this
        });
    },

    onCancelButtonClicked: function() {
        this.hide();
    },

    addTab: function(layer, callback) {
        this.rulesTabs.addTab(layer, callback);
    },

    removeTab: function(layer) {
        this.rulesTabs.removeTab(layer);
    },

    onBeforeRender: function() {

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;'

        this.rulesTabs = new Viewer.widgets.PlanificationToolsLayerRules();
        
        var c = {
            layout: 'fit',
            items: this.rulesTabs,
            buttons: [
                this.btnClose = new Ext.Button({
                    text: 'Cerrar',
                    listeners: {
                        click: this.onCancelButtonClicked,
                        scope: this
                    }
                })
            ]
        };

        this.add(c);
    }

});

Ext.reg('vw_planification_tools_layer_window', Viewer.dialog.PlanificationToolsRulesWindow);

Viewer.widgets.PlanificationToolsLayerRules = Ext.extend(Ext.Panel, {

    constructor: function(config) {

        Viewer.widgets.PlanificationToolsLayerRules.superclass.constructor.call(this, Ext.apply({
            border: false,
            layout: {
                type: 'accordion',
                animate: true
            }
        }, config));
    },

    addTab: function(layer, callback, process) {
        process = process || 'createTabByGetLegendGraphic';
        var method = this[process];
        method.apply(this, [layer, callback]);
    },

    createTabByGetLegendGraphic: function(layer, callback) {

        callback = typeof(callback) == 'function' ? callback : function() {};

        var url = layer.url || window.app.sources.local.url;

        url += '?' + [
            'TRANSPARENT=TRUE',
            'SERVICE=WMS',
            'VERSION=' + window.app.sources.local.baseParams.VERSION,
            'REQUEST=GetLegendGraphic',
            'EXCEPTIONS=application/vnd.ogc.se_xml',
            'LAYER=' + layer.name || layer.title,
            'format=image/png',
            'legend_options=fontAntiAliasing:true;fontSize:11;fontName:Arial',
            'SCALE=1091958.1364361627'
        ].join('&');

        var newTab = {
            id: 'rules-tab-' + layer.layerID,
            xtype: 'panel',
            layout: 'fit',
            title: layer.layerName,
            items: {
                xtype: 'panel',
                autoScroll: true,
                padding: '8px 15px',
                html: '<img src="' + url + '" class="" />'
            }
        };

        this.add(newTab);
        this.doLayout();
        callback(true);
    },

    createTabByGetStyles: function(layer, callback) {

        callback = typeof(callback) == 'function' ? callback : function() {};

        this.getStyles(layer, function(options, success, response) {

            if (!success) {
                callback(false);
                return;
            }

            var format = new OpenLayers.Format.SLD();
            var sld = format.read(response.responseXML || response.responseText);
            var dataset = this.createDataSet(sld);

            var store = new Ext.data.JsonStore({
                autoLoad: true,
                autoDestroy: true,
                storeId: 'store-' + layer.layerID,
                idIndex: 0,
                fields: [ 'id', 'name', 'title', 'description', 'symbolizers' ],
                data: dataset,
                listeners: {
                    exception: function() {
                        callback(false);
                    },
                    load: function(store, records, options) {

                        var list = new RulesListview({
                            layer: layer,
                            store: store
                        });

                        var onGridAdded = function(container, component, index) {
                            container.un('add', onGridAdded, this);
                            // FIXME: expand() doesn't seams to work...
                            component.expand(true);
                            callback(true);
                            this.doLayout();
                        };

                        this.on('add', onGridAdded, this);
                        this.add(list);
                    },
                    scope: this
                }
            });
        });
    },

    removeTab: function(layer) {
        var tab = this.get('rules-tab-' + layer.layerID);
        this.remove(tab);
        this.doLayout();
    },

    getStyles: function(layer, callback) {
        var version = layer.params['VERSION'];
        if (parseFloat(version) > 1.1) {
            //TODO don't force 1.1.1, fall back instead
            version = '1.1.1';
        }    
        Ext.Ajax.request({
            url: layer.url,
            params: {
                'SERVICE': 'WMS',
                'VERSION': version,
                'REQUEST': 'GetStyles',
                'LAYERS': [layer.params['LAYERS']].join(',')
            },   
            method: 'GET',
            disableCaching: false,
            callback: callback,
            scope: this 
        });                 
    },

    createDataSet: function(sld) {

        var dataset = [];

        // Should be only one named layer in this SLD
        for (var o in sld.namedLayers) {

            var styles = sld.namedLayers[o].userStyles;

            for (var s=0, sl=styles.length; s<sl; s++) {

                var rules = styles[s].rules;

                for (var r=0, rl=rules.length; r<rl; r++) {

                    var rule = rules[r];
                    var record = this.createDataRecord(rule);
                    record !== null && dataset.push(record);
                }

            }
        }

        return dataset;
    },

    createDataRecord: function(rule) {

        if (rule.title === null) {
            return null;
        }

        var record = {
            id: rule.id,
            name: rule.name,
            title: rule.title,
            description: rule.description,
            symbolizers: []
        };

        for (s in rule.symbolizer) {
            try {
                var Constructor = OpenLayers.Symbolizer[s];
                var symbolizer = new Constructor(rule.symbolizer[s]);
                record.symbolizers.push(symbolizer);
            } catch (e) {}
        }

        return record;
    }

});

Ext.reg('vw_planification_tools_layer_rules', Viewer.widgets.PlanificationToolsLayerRules);


var RulesListview = Ext.extend(Ext.Panel, {


    constructor: function(config) {

        var items = [];

        config.store.each(function(record) {
            items.push({
                xtype: 'panel',
                border: false,
                layout: {
                    type: 'hbox',
                    align: 'left',
                    pack: 'start'
                },
                items: [
                    new GeoExt.FeatureRenderer({
                        symbolizers: record.get('symbolizers'),
                        style: {
                            margin: 4,
                            padding: '5px 10px'
                        }
                    }),
                    {
                        xtype: 'box',
                        autoEl: {
                            tag: 'span',
                            'class': 'link-planification-tools',
                            html: record.get('title')
                        },
                        style: {
                            margin: 4,
                            padding: '8px 10px 0px'
                        }
                    }
                ]
            });
        });

        RulesListview.superclass.constructor.call(this, Ext.apply({
            id: 'rules-tab-' + config.layer.layerID,
            xtype: 'panel',
            layout: 'fit',
            title: config.layer.layerName,
            items: {
                xtype: 'panel',
                layout: 'fit',
                items: [{
                    xtype: 'panel',
                    border: false,
                    autoScroll: true,
                    items: items
                }]
            }
        }, config));
    }
});

})();

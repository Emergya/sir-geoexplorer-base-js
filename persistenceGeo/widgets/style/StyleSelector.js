/*
 * StyleSelector.js Copyright (C) 2013 This file is part of PersistenceGeo project
 *
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 *
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */


/**
 * @requires widgets/Styler.js
 */

/** api: (define)
 *  module = PersistenceGeo.widgets.style
 *  class = StyleSelector
 */

/** api: (extends)
 *  widgets/Styler.js
 */
Ext.namespace("PersistenceGeo.widgets.style");

/** api: constructor
 *  .. class:: StyleSelector(config)
 *
 *    Plugin providing a styles selector for WMS geoserver layers.
 */
PersistenceGeo.widgets.style.StyleSelector = Ext.extend(Viewer.plugins.Styler, {

    /** api: ptype = pgeo_style_selector */
    ptype: "pgeo_style_selector",

    id: 'style_selector_component',

    /** i18n **/
    menuText: "Style selector",

    /** api: config[checkUserInfo]
     *  ``Boolean``
     *  Check user logged info to active this tool
     */
    checkUserInfo: false,

    /** private: method[handleLayerChange]
     *  :arg record: ``GeoExt.data.LayerRecord``
     *
     *  Handle changes to the target viewer's selected layer.
     */
    handleLayerChange: function(record) {
        console.log(record);
        // only check if is disabled!!
        this.checkIfDisable(record);
    },

    /** private: method[checkIfDisable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Enable this.launchAction if the layer can be management by
     *  the user logged or disable this.launchAction otherwise (if this.checkUserInfo flag is active)
     */
    checkIfDisable: function(record) {

        var disable = true;

        if ( !! record) {
            var layer = record.getLayer();
            disable = false;
            /*
             * Postgis and WMS layers
                sir-admin_db=> select * from gis_layer_type;
                 id |    name     |   tipo    
                ----+-------------+-----------
                  1 | WMS         | Raster
                  2 | WFS         | Raster
                  3 | KML         | Raster
                  4 | WMS         | Vectorial
                  5 | WFS         | Vectorial
                  6 | KML         | Vectorial
                  7 | postgis     | Vectorial
                  8 | geotiff     | Raster
                  9 | imagemosaic | Raster
                 10 | imageworld  | Raster
            */

            disable = !!layer.metadata && !(layer.metadata.layerTypeId == 7 || layer.metadata.layerTypeId == 4);
        }

        this.launchAction.setDisabled(disable);

        return disable;
    },

    addOutput: function(config) {
        config = config || {};
        var record = this.target.selectedLayer;

        var origCfg = this.initialConfig.outputConfig || {};
        this.outputConfig.title = this.menuText + ": " + record.get("title");
        this.outputConfig.shortTitle = record.get("title");

        record = this.repairRecord(record);

        // TODO: Inheritance of target between WMSStyleDialog, RulePanel... PointSymbolizerMod
        Viewer.PointSymbolizerMod.prototype.defaultRestUrl = this.target.defaultRestUrl;

        Ext.apply(config, gxp.WMSStylesDialog.createGeoServerStylerConfig(record, null, this.target.persistenceGeoContext));
        if (this.rasterStyling === true) {
            config.plugins.push({
                ptype: "gxp_wmsrasterstylesdialog"
            });
        }
        Ext.applyIf(config, {
            style: "padding: 10px"
        });

        var output = gxp.plugins.Styler.superclass.addOutput.call(this, config);
        if (!(output.ownerCt.ownerCt instanceof Ext.Window)) {
            output.dialogCls = Ext.Panel;
            output.showDlg = function(dlg) {
                dlg.layout = "fit";
                dlg.autoHeight = false;
                output.ownerCt.add(dlg);
            };
        }

        output.stylesStore.on("load", function() {
            if (!this.outputTarget && output.ownerCt.ownerCt instanceof Ext.Window) {
                output.ownerCt.ownerCt.center();
            }
        });

        var this_ = this;
        output.on("ready", function(){
            this_.clearOutput(output);
        });
    }, 

    clearOutput: function (output){
        // from setupNonEditable function in WMSStylesDialog
        output.editable = false;
        // disable styles toolbar
        output.items.get(1).hide();
        // disable rules toolbar
        output.items.get(3).hide();
        // enable style selector (extra)
        output.items.get(0).items.get(0).setDisabled(false);
    }

});

Ext.preg(PersistenceGeo.widgets.style.StyleSelector.prototype.ptype, PersistenceGeo.widgets.style.StyleSelector);
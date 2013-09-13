/*
 * GeonetworkMetadataViewer.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * @required  persistenceGeo/widgets/GeoNetworkTool.js
 */

/** api: (define)
 *  module = PersistenceGeo.tree
 *  class = GeonetworkMetadataViewer
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.GeonetworkMetadataViewer
 * 
 * GN metadata viewer. See #87025
 * 
 */
PersistenceGeo.tree.GeonetworkMetadataViewer = Ext.extend(PersistenceGeo.widgets.GeoNetworkTool, {

    /** api: ptype = pgeo_gnmetadataviewer */
    ptype: "pgeo_gnmetadataviewer",

    /** i18n **/
    toolText: 'Show metadata of the selected layer',
    toolTooltipText: 'Show metadata of the selected layer',
    toolWindowText: "Layer {0} metadata",

    /** Tool default icon **/
    toolIconCls: 'vw-icon-show-metadata',

    /** Window sizes **/
    windowWidth: 800,
    windowHeight: 600,

    /** Selected target data **/
    selectedTargetId: null,
    selectedTargetName: null,
    layerSelected: null,

    /** Windows positions. Initilaized in showWindow function. **/
    publishRequestWindowPos: null,
    metadataWindowPos: null,
    targetWindowPos: null,

    /* Metadata UUID of the selected layer */    
    layerUuid: null,

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Only enabled when the selected layer have metadata UUID
     */
    checkIfEnable: function(record) {

        var disable = true;

        if(record && record.getLayer()){
          var layer = record.getLayer();
          this.layerSelected = record;
          this.layerUuid = layer.metadata.metadataUuid;
          disable = !this.layerUuid;
        }

        this.launchAction.setDisabled(disable); 
    },

    /**

     * api: method[showWindow]
     * Show all windows of this component.
     */
    showWindow: function(layerRecord) {

      var aResTab = new GeoNetwork.view.ViewPanel({
            serviceUrl : catalogue.services.mdView + '?uuid=' + this.layerUuid,
            lang : catalogue.lang,
            autoScroll : true,
            resultsView : catalogue.resultsView,
            layout : 'fit',
            // autoHeight:true,
            padding : '5px 25px',
            currTab : GeoNetwork.defaultViewMode || 'simple',
            printDefaultForTabs : GeoNetwork.printDefaultForTabs || false,
            printUrl : '../../apps/html5ui/print.html',
            catalogue : catalogue,
            // maximized: true,
            metadataUuid : this.layerUuid
      });

      this.window = new Ext.Window({
            title:  this.toolWindowText,
            width: this.windowWidth,
            height: this.windowHeight,
            layout: 'fit',
            modal: false,
            items: aResTab,
            closeAction: 'hide',
            controller: this,
            constrain: true
        });

      this.window.show();
    }

});

Ext.preg(PersistenceGeo.tree.GeonetworkMetadataViewer.prototype.ptype, PersistenceGeo.tree.GeonetworkMetadataViewer);

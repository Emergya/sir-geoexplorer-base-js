/*
 * GeonetworkNewMetadataPanel.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * Authors: Luis Román (mailto:lroman@emergya.com)
 */


Ext.namespace("PersistenceGeo.widgets");

/** api: (define)
 *  module = PersistenceGeo.widget
 *  class = GeonetworkNewMetadataPanel
 */
/** api: constructor 
 *  .. class:: GeonetworkNewMetadataPanel(config)
 *
 *     Create a GeoNetwork form for metadata creation
 *
 *
 *     Default metadata store to use could be overriden when setting
 *     GeoNetwork.Settings.mdStore variables. Default is :class:`GeoNetwork.data.MetadataResultsStore`.
 *
 *     Some modifications by Emergya so it plays nicer with SIR-admin.
 *
 */
PersistenceGeo.widgets.GeoNetworkNewMetadataPanel = Ext.extend(GeoNetwork.editor.NewMetadataPanel, {

	ptype: "pgeo_gnnewmetadatapanel",

	initComponent: function(){
		PersistenceGeo.widgets.GeoNetworkNewMetadataPanel.superclass.initComponent.call(this);


		this.on("render", function() {
            // We add a mask in the topmost container
            var w = this;
            do {
                w = w.ownerCt;
            } while (w.ownerCt);

			this.loadMask = new Ext.LoadMask(w.getEl());
			this.loadMask.show();
		},this);
	},

	/**
     * manageLoadedEvent
     * Check if groupStore and templateStore are loaded. When both are loaded,
     * fires the dataLoaded event with the current template and current group.
     * The event has the following arguments :
     *   - this (newMetadataPnel)
     *   - template store value
     *   - group store value
     */
    manageLoadedEvent: function() {
        this.storeLoaded++;
        if(this.storeLoaded >= this.nbStore) {
            this.fireEvent('dataLoaded', this, this.selectedTpl, this.selectedGroup);

            this.loadMask.hide();
        }
    },
    

});

Ext.preg(PersistenceGeo.widgets.GeoNetworkNewMetadataPanel.prototype.ptype, PersistenceGeo.widgets.GeoNetworkNewMetadataPanel);
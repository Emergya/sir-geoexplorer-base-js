/*
 * GeonetworkViewPanel.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * Authors: Luis Román Gútiérrez (mailto:lroman@emergya.com)
 */


Ext.namespace('PersistenceGeo.tree');

/** api: (define)
 *  module = GeoNetwork.view
 *  class = ViewPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
/** api: constructor 
 *  .. class:: ViewPanel(config)
 *
 *     Create a GeoNetwork metadata view window
 *     to display a metadata record. The metadata view use the view service.
 *
 *     A toolbar is provided with:
 *
 *      * a view mode selector
 *      * a metadata menu (:class:`GeoNetwork.MetadataMenu`)
 *      * a print mode menu (for pretty HTML printing)
 *      * a menu to turn off tooltips (on metadata descriptors)
 *      * an option to give metadata-specific feedback
 *
 */
PersistenceGeo.widgets.GeonetworkViewPanel = Ext.extend(GeoNetwork.view.ViewPanel, {
	/** api: ptype= pgeo_gnviewpanel*/
	ptype: "pgeo_gnviewpanel",

	initComponent: function() {
		Ext.applyIf(this, this.defaultConfig);

		this.tipTpl = new Ext.XTemplate(GeoNetwork.util.HelpTools.Templates.SIMPLE);
		this.relatedTpl = new Ext.XTemplate(this.relatedTpl || GeoNetwork.Templates.Relation.SHORT);

		this.tbar = [this.createViewMenu(), '->', this.createPrintMenu()];

		GeoNetwork.view.ViewPanel.superclass.initComponent.call(this);
		this.metadataSchema = this.record ? this.record.get('schema') : '';

		this.add(new Ext.Panel({
			autoLoad: {
				url: this.serviceUrl + '&currTab=' + this.currTab,
				callback: function() {
					this.loadMask.hide();
					this.fireEvent('aftermetadataload', this);
				},
				scope: this
			},
			border: false,
			frame: false,
			autoScroll: true
		}));

		if (this.permalink) {
			// TODO : Add viewpanel state (ie. size for window, tab)
			var l = GeoNetwork.Util.getBaseUrl(location.href) + "?uuid=" + this.metadataUuid;
			this.getTopToolbar().add(GeoNetwork.Util.buildPermalinkMenu(l));
		}

		this.addEvents(
			/** private: event[search]
			 *  Fires search.
			 */
			"aftermetadataload"
		);
		this.on({
			"aftermetadataload": this.afterMetadataLoad,
			"render": function() {
				// We show a loading indicator in the topmost container 
				//before updating the  metadata form and hide it  when its loaded.
				var w = this;
				do {
					w = w.ownerCt;
				} while (w.ownerCt);

				this.loadMask = new Ext.LoadMask(w.getEl());
				this.loadMask.show();
				var updater = this.getUpdater();

				updater.on("beforeupdate", function() {
					this.loadMask.show();
				}, this);

				updater.on("update", function() {
					this.loadMask.hide();
				}, this);
			},
			scope: this
		});


	}
});

/** api: xtype = gn_view_viewpanel */
Ext.reg(PersistenceGeo.widgets.GeonetworkViewPanel.prototype.ptype, PersistenceGeo.widgets.GeonetworkViewPanel);
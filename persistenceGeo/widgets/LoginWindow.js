/*
 * LoginWindow.js Copyright (C) 2013 This file is part of PersistenceGeo project
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

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = LoginWindow
 */
Ext.namespace("PersistenceGeo.widgets");

/**
 * Class: PersistenceGeo.widgets.LoginWindow
 * 
 * Login window for persistence geo applications
 * 
 */
PersistenceGeo.widgets.LoginWindow = Ext.extend(Ext.Window,{
    
    /** ptype **/
    ptype: "pgeo_loginwindow",

    /** Session and widget parameters and variables **/
    persistenceGeoContext: null,
    target: null,
    defaultRestUrl: "/sig-admin/rest",
    loginUrl: "/sig-admin/j_spring_security_check",
    logoutUrl: "/sig-admin/logout",

    /** window config **/
    layout: "fit",
    width: 250,
    height: 170,
    plain: true,
    border: false,
    modal: true,
    closeAction: 'hide',

    /* i18n */
    title: "Login",
    backText: "Back",
    nextText: "Next",
    loginText: "Login",
    logoutText: "Logout, {user}",
    loginErrorText: "Invalid username or password.",
    userFieldText: "User",
    passwordFieldText: "Password", 
    saveErrorText: "Trouble saving: ",
    loginUserErrorTitleText: 'Login error!',
    loginUserErrorText: 'Unknow user \'{0}\'.\n Please check username and password or contact with the system administrator',

    /**
     * Used to check if the login button is pressed by an user
     **/
    buttonPressed: false,

    constructor: function(config) {
        Ext.apply(this, config);
        var url = this.loginUrl;

        console.log("************************ AUTH URL is " + url + "***********************");
        var panel = new Ext.FormPanel({
            url: url,
            frame: true,
            labelWidth: 60,
            defaultType: "textfield",
            errorReader: {
                read: function(response) {
                    var success = false;
                    var records = [];
                    if (response.status === 200) {
                        success = true;
                    } else {
                        records = [
                            {data: {id: "j_username", msg: this.loginErrorText}},
                            {data: {id: "j_password", msg: this.loginErrorText}}
                        ];
                    }
                    return {
                        success: success,
                        records: records
                    };
                }
            },
            items: [{
                fieldLabel: this.userFieldText,
                name: "j_username",
                allowBlank: false,
                listeners: {
                    render: function() {
                        this.focus(true, 100);
                    }
                }
            }, {
                fieldLabel: this.passwordFieldText,
                name: "j_password",
                inputType: "password",
                allowBlank: false
            }],
            buttons: [{
                text: this.loginText,
                formBind: true,
                handler: submitLogin,
                scope: this
            }],
            keys: [{ 
                key: [Ext.EventObject.ENTER], 
                handler: submitLogin,
                scope: this
            }]
        });

        function submitLogin() {
            panel.buttons[0].disable();
            this.buttonPressed = true;
            panel.getForm().submit({
                success: function(form, action) {
                    this.postLoginFunction(form, action);
                    this.un("beforedestroy", this.cancelAuthentication, this);
                    this.hide();
                },
                failure: function(form, action) {
                    if (!!action.response.status 
                            && (action.response.status == 200
                                || action.response.status == 404
                                || action.response.status == 405)){
                        // debug return action.response.status == 404 || 405 || 200
                        this.postLoginFunction(form, action);
                        this.un("beforedestroy", this.cancelAuthentication, this);
                        this.hide();
                        Ext.Msg.alert('¡Cuidado!', 'Modo debug activo. Pueden producirse problemas con la sesi&oacute;n de usuario.');
                    }else{
                        this.authorizedRoles = [];
                        panel.buttons[0].enable();
                        form.markInvalid({
                            "j_username": this.loginErrorText,
                            "j_password": this.loginErrorText
                        });
                    }
                },
                scope: this
            });
        }

        config.items = panel;
        this.panel = panel;

        if(!!this.target){
            if(this.target.loginText){
                config.title = this.target.loginText;
            }

            if(this.target.authorizedRoles){
                this.authorizedRoles = this.target.authorizedRoles;
            }

            this.cookieParamName = this.target.cookieParamName;
        }

        PersistenceGeo.widgets.LoginWindow.superclass.constructor.apply(this, arguments);
    },

    initComponent: function(config){

        if(!!config){
            config.listeners= {
                beforedestroy: this.cancelAuthentication,
                scope: this
            };
        }
        
        PersistenceGeo.widgets.LoginWindow.superclass.initComponent.apply(this, arguments);
    },

    /** private: method[setCookieValue]
     *  Set the value for a cookie parameter
     */
    setCookieValue: function(param, value) {
        document.cookie = param + '=' + escape(value);
    },

    /** private: method[clearCookieValue]
     *  Clear a certain cookie parameter.
     */
    clearCookieValue: function(param) {
        document.cookie = param + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    },

    /** private: method[getCookieValue]
     *  Get the value of a certain cookie parameter. Returns null if not found.
     */
    getCookieValue: function(param) {
        var i, x, y, cookies = document.cookie.split(";");
        for (i=0; i < cookies.length; i++) {
            x = cookies[i].substr(0, cookies[i].indexOf("="));
            y = cookies[i].substr(cookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==param) {
                return unescape(y);
            }
        }
        return null;
    },

    /** private: method[logout]
     *  Log out the current user from the application.
     */
    logout: function() {
        Ext.Ajax.request ({ 
            url: this.logoutUrl, 
            method: 'GET',    
            success: function(response) { 
                this.confirmLogout(response);
            }, 
            failure: function(response) { 
                this.confirmLogout(response);
            },
            scope: this 
        });
    },

    setAuthorizedRoles: function(authRoles){
        if(!!this.target){
            this.target.setAuthorizedRoles(authRoles);
        }
        this.authorizedRoles = this.target.authorizedRoles;
    },

    // confirm logout when logout call is handled
    confirmLogout: function(response){
        this.clearCookieValue("JSESSIONID");
        this.clearCookieValue(this.cookieParamName);
        this.setAuthorizedRoles([]);
        this.handlePermissions();
        this.closePersistenceGeoContext();
        this.showLogin();
    },

    closePersistenceGeoContext: function (){
        // erase persistence context and save layer
        this.target.persistenceGeoContext.clearLayers();
        this.target.persistenceGeoContext.userLogin = null;
        this.target.persistenceGeoContext.authUser = null;
        this.target.persistenceGeoContext.userInfo = null;
        this.target.persistenceGeoContext.activeStore = false;
        this.target.persistenceGeoContext.saveModeActive = this.target.persistenceGeoContext.SAVE_MODES.ANONYMOUS;
    },

    /** private: method[authenticate]
     * Show the login dialog for the user to login.
     */
    authenticate: function() {
        this.show();
    },

    postLoginFunction: function(form, action){
        try{
            var user = form.findField('j_username').getValue();
            this.setCookieValue(this.cookieParamName, user);
            this.obtainUserInfo(action);
        }catch (e){
            //TODO: handle
            console.log(e.stack);
        }
    },

    // obtain user info from action.response.responseText or another request
    obtainUserInfo: function(action){
        var userInfo;
        if(!!action 
            && action.response.status == 200
            && !!action.response.responseText){
            try{
                userInfo = Ext.util.JSON.decode(action.response.responseText).data;
            }catch(e){
                // not json response, make a request to get userInfo again!!
                userInfo = null;
            }
        }
        if(!!userInfo){
            this.confirmUserInfo(userInfo);
        }else{
            Ext.Ajax.request ({ 
                url: this.defaultRestUrl + '/persistenceGeo/getUserInfo', 
                method: 'POST',    
                success: function(response) { 
                    var json = Ext.util.JSON.decode(response.responseText);
                    userInfo = json.data;
                    this.confirmUserInfo(userInfo);
                }, 
                failure: function(response) { 
                    Ext.Msg.alert('¡Cuidado!', 'No se encuentra el servidor de autenticaci&oacute;n : ' + response.responseText);
                    this.cancelAuthentication();
                },
                scope: this 
            });
        }
        
    },

    // confirm user info loaded
    confirmUserInfo: function(userInfo){

         if(!!userInfo && !!userInfo.authorityId){
            // Authority login
            this.authorityLogin(userInfo);
        }else if(!!userInfo && userInfo.admin){
            // Authority login
            this.adminLogin(userInfo);
        }else{
            // Anonymous login
            this.anonymousLogin(userInfo);
            this.cancelAuthentication();
            //Ext.Msg.alert('¡Error en login!', "No se encuentra la informaci&oacute;n de usuario");
        }
    },

    // delegated to this.target.cancelAuthentication if exists
    cancelAuthentication: function(){
        if(!!this.target
            && !!this.target.cancelAuthentication)
            this.target.cancelAuthentication();
    },

    adminLogin: function(userInfo){
        // show user info on log console.log(userInfo);
        var roles = new Array();
        roles.push("ROLE_ADMINISTRATOR");
        this.userLogin(userInfo, roles);
    },

    /** Method: authorityLogin 
     * Login for an admin of an authorithy
     **/
    authorityLogin: function(userInfo){
        // show user info on log console.log(userInfo);
        var roles = new Array();
        if(!!userInfo.authorityId){
            roles.push(userInfo.authorityId);
        }
        if(userInfo.admin){
            roles.push("ROLE_ADMINISTRATOR");
        }
        this.userLogin(userInfo, roles);
    },
    
    /** Method: userLogin 
     * Default login for an user.
     **/
    userLogin: function(userInfo, roles){
        this.userInfo = userInfo;
        if(!!roles){
            this.setAuthorizedRoles(roles);
        }
        this.showLogout(userInfo.nombreCompleto);
        this.loadPersistenceGeoContext();
        this.handlePermissions();
        // TODO: Handle permission!!!
    },

    /** Method: isAuthorizedIn 
     * Checks if authenticated user has permision for a role 
     **/
    anonymousLogin: function(userInfo){
        this.userInfo = userInfo;
        this.target.persistenceGeoContext = new PersistenceGeo.Context({
            map: this.target.mapPanel.map,
            defaultRestUrl: this.target.defaultRestUrl,
            activeStore: false,
            treeManager: this.target.tools.layermanager,
            scope: this.target
        });
        this.target.persistenceGeoContext.saveModeActive = this.target.persistenceGeoContext.SAVE_MODES.ANONYMOUS;
        this.handlePermissions();
        this.showLogin();
    },

    /** Method: isAuthorizedIn 
     * Checks if authenticated user has permision for a role 
     **/
    isAuthorizedIn: function(role){
        var authorized = false;
        for(var i = 0; i < this.authorizedRoles.length; i++){
            if(this.authorizedRoles[i] == role){
                authorized = true;
                break;
            }
        }
        return authorized;
    },

    loadPersistenceGeoContext: function (){
        // init context and save layer
        this.target.persistenceGeoContext.userLogin = this.getCookieValue(this.cookieParamName);
        this.target.persistenceGeoContext.authUser = this.target.authorizedRoles[0];
        this.target.persistenceGeoContext.userInfo = this.userInfo;
        this.target.persistenceGeoContext.activeStore = true;
        this.target.persistenceGeoContext.scope = this;
        this.target.persistenceGeoContext.saveModeActive = this.target.persistenceGeoContext.SAVE_MODES.GROUP;
        this.target.persistenceGeoContext.load();  
        // We send an event to inform listeners that we have logged a user.
        this.target.fireEvent("loginstatechange", this.target, this.userInfo);
    },

    /**
     * private: method[applyLoginState]
     * Attach a handler to the login button and set its text.
     */
    applyLoginState: function(iconCls, text, handler, scope) {
        var loginButton = Ext.getCmp("loginbutton");
        if(!!loginButton){
            loginButton.setIconClass(iconCls);
            loginButton.setText(text);
            loginButton.setHandler(handler, scope);
        }
    },

    /** private: method[showLogin]
     *  Show the login button.
     */
    showLogin: function() {
        var text = this.loginText;
        var handler = this.authenticate;
        this.applyLoginState('login', text, handler, this);
        this.panel.buttons[0].enable();
        var form = this.panel.getForm();
        if(this.buttonPressed
            && !!form
            && !!form.getFieldValues()["j_password"]
            && !!form.getFieldValues()["j_username"]
            && form.getFieldValues()["j_username"].length > 0
            && form.getFieldValues()["j_password"].length > 0){
            form.markInvalid({
                "j_username": this.loginErrorText,
                "j_password": this.loginErrorText
            });
            this.buttonPressed = false;
            this.show();
            Ext.Msg.alert(this.loginUserErrorTitleText, String.format(this.loginUserErrorText, form.getFieldValues()["j_username"]));
        }
    },

    /** private: method[showLogout]
     *  Show the logout button.
     */
    showLogout: function(user) {
        var text = new Ext.Template(this.logoutText).applyTemplate({user: user});
        var handler = this.logout;
        this.applyLoginState('logout', text, handler, this);
    },

    doAuthorized: function(roles, callback, scope) {
        if (this.userInfo && !!this.userInfo.id || !this.authenticate) {
            window.setTimeout(function() { callback.call(scope); }, 0);
        } else {
            this.authenticate();
            this._authFn = function authFn() {
                delete this._authFn;
                this.doAuthorized(roles, callback, scope, true);
            };
            this.on("authorizationchange", this._authFn, this, {single: true});
        }
    },

    /** private: method[handlePermissions]
     *  Handle user permissions.
     */
    handlePermissions: function(){
        new PersistenceGeo.permissions.PermissionHandler({
            target: this.target,
            userInfo: this.userInfo
        }).handlePermissions();
    }

});

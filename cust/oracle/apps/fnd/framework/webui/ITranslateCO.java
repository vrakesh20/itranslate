/* +===============================================================================================================+
-- |				                                       					     		                	                             |
-- |Author: Rakesh Vagvala				                        	     		                	                             |
-- |Initial Build Date: 	    		                             	                     	                             |
-- |Source File Name: ITranslateCO.java			            	                     	                           	 		   |
-- |									     			                                                                                   |
-- |Object Name: 					                                	     		                	                             |
-- |Description: This controller is used to enable translation on any OAF Page in Oracle Apps                      |
-- |								  	     		                                                    	                             |
-- |Dependencies:	It relies on iTranslate.js to enable translation					   	                                   |
-- |              Translation will be applied only if "CUST_ENABLE_ITRANSLATE" profile option is set to "Yes"      |
-- |              This profile option can be controlled at site/responsibility/function/user level                 |
-- |								   	     		                                                    	                             |
-- |Usage:        Just personalize the page where ever you want to enable iTranslate & add a dummy stack layout    |
-- |              with id say 'iTranslateWeaveMagic' and attach ITranslateCO as the controller                     |
-- |              You reload the page and you will be rest assured to see the magic of iTranslate                  |
-- |Future:       We can enhance ITranslateCO to read the value in comments field of optional stack layout bean    |
-- |              with id 'iTranslateMoreMagic' to override the profile values of query/store . As profile is set  |
-- |              at responsibility level, we can leverage this to add support to page specific requirements       |
-- |									     		                                                      	                             |
-- |Modification History:			                        				     	                	                             |
-- |===============						                              	     	                	                             |
-- |Version       Date          Author                  Remarks			              		                             |
-- |=========   =============  =========               =============================                               |
-- |1.0         02-NOV-2019    Rakesh Vagvala	        Initial draft version                                    	   |
-- +==============================================================================================================+ */

package cust.oracle.apps.fnd.framework.webui;

import oracle.apps.fnd.framework.webui.OAControllerImpl;

import oracle.apps.fnd.framework.webui.OAPageContext;
import oracle.apps.fnd.framework.webui.beans.OAWebBean;
import oracle.apps.fnd.framework.webui.beans.OABodyBean;
import oracle.apps.fnd.framework.OAApplicationModule;

public class ITranslateCO extends OAControllerImpl
{

  private static final String ITRANSLATE_JS = "cust/js/itranslate/iTranslate.js";
  private static final String ITRANSLATE_CONFIG_DIR = "cust/js/itranslate/config/";
  private static final String ITRANSLATE_STORE_DIR = "cust/js/itranslate/store/";

 public ITranslateCO()
 {

 }

 private static String encloseInSingleQuotes(String inputString) {
   if(inputString == null) {
     return "''";
   }
   StringBuilder sb = new StringBuilder();
   sb.append("'").append(inputString).append("'");
   return sb.toString();
 }

 private static boolean isNullOrEmpty(String str) {
    if(str != null && !str.trim().isEmpty())
        return false;
    return true;
}

 public void processRequest(OAPageContext pageContext, OAWebBean webBean) {

   try {
           /* Get iTranslate Profiles*/

           // iTranslateConfig is the mandatory parameter which is required for onboarding any page to iTranslate
           String iTranslateConfig = pageContext.getProfile("CUST_ITRANSLATE_CONFIG");

           //Below all parameters are optional
           String iTranslateEnabled = pageContext.getProfile("CUST_ENABLE_ITRANSLATE");
           String iTranslateQuery = pageContext.getProfile("CUST_ITRANSLATE_QUERY");
           String iTranslateStore = pageContext.getProfile("CUST_ITRANSLATE_STORE");
           String iTranslateDebugMode = pageContext.getProfile("CUST_ITRANSLATE_DEBUG");

           if( !isNullOrEmpty(iTranslateEnabled) && !"N".equals(iTranslateEnabled) && !isNullOrEmpty(iTranslateConfig) ) {

             if (pageContext.isLoggingEnabled(2)) {
               pageContext.writeDiagnostics(this, "@processRequest - ITranslateCO - enabling iTranslate", 2);
             }

             /*This is the mandatory iTranslate Library to be loaded*/
             pageContext.putJavaScriptLibrary("iTranslate", ITRANSLATE_JS);

             /*Setting default language, this default language could be overridden by user cookie at client side*/
             String iTranslateDefaultLanguage = "english";
             if(!"Y".equalsIgnoreCase(iTranslateEnabled) && !"english".equalsIgnoreCase(iTranslateEnabled)) {
               iTranslateDefaultLanguage = iTranslateEnabled;
             }
             if( !isNullOrEmpty(iTranslateConfig) ) {
               iTranslateConfig = ITRANSLATE_CONFIG_DIR + iTranslateConfig;
             }
             if( !isNullOrEmpty(iTranslateStore) ) {
               iTranslateStore = ITRANSLATE_STORE_DIR+iTranslateStore;
             }

             OABodyBean bodyBean = (OABodyBean) pageContext.getRootWebBean();

             /*Building the onLoadEvents based on iTranslate*/
             StringBuilder onLoadEvents = new StringBuilder();
             onLoadEvents.append("initITranslate(");
             onLoadEvents.append(encloseInSingleQuotes(iTranslateConfig)).append(",");
             onLoadEvents.append(encloseInSingleQuotes(iTranslateDefaultLanguage)).append(",");
             onLoadEvents.append( ("Y".equalsIgnoreCase(iTranslateDebugMode) ? "true": "false") ).append(",");
             onLoadEvents.append(encloseInSingleQuotes(iTranslateQuery)).append(",");
             onLoadEvents.append(encloseInSingleQuotes(iTranslateStore));
             onLoadEvents.append(");");

             /*Bind these onLoadEvents to bodyBean so that they will be triggered on page load*/
             bodyBean.setOnLoad(onLoadEvents.toString());
           }
   }
   catch(Exception e) {
     if (pageContext.isLoggingEnabled(2)) {
       pageContext.writeDiagnostics(this, "@processRequest - ITranslateCO "+  e.getMessage(), 2);
     }
   }

     super.processRequest(pageContext, webBean);
 }

 public void processFormRequest(OAPageContext pageContext, OAWebBean webBean)
 {
  super.processFormRequest(pageContext, webBean);
 }

}

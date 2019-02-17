# imcoder-blog

Java博客  

demo: [https://imcoder.site](https://imcoder.site "imcoder.site")

## develop log

#### 2019.05.06

new account auth system, new message system, photo、video detail page, and so forth.

    （1）site module:
    1、support admin to set config for article and file upload level, upload size limit.
    2、support admin to change the group level of user.
    3、the third-party service config is separated from the config file of self-contained config.
    >
    （2）user module
    1、redesign the account auth system to unify various login methods.
    2、the user entity class only retains the material information, and other information is set by the user-setting, the user-auth, and the user-status class are saved.
    3、support users to modify account background settings.
    4、support users to turn off notify email push.
    5、support users to modify avatars, support admin to configure default avatar list.
    >
    （3）album module:
    1、support user-customized album photo sorting.
    2、support for backing up sorting data when deleting photos and albums.
    3、add image details page.
    4、support for commenting on photos.
    5、modify not hardcode album cover in album information.
    >
    （4）video module
    1、add video details page.
    2、support for video comments.
    3、support users to update the modified video.
    4、modify update url address bar when view video.
    5、use Plyr to replace origin html5 video player.
    >
    File Service:
    1、unified file service, automatically switch according to the configured service type.
    >
    （5）message service:
    1、unified comment, private message, system message to message service class.
    2、unified commenting service, and pluging for commenting features.
    3、support user withdrawal private letter.
    4、support admin message withdraw, system message deletion.
    5、support system messages, letter clear unread status.
    6、message support automatic recognition of images, links.
    7、message supports emoji expressions, adding custom annotations for escaping emoji expressions.

#### 2019.01.25

implement WebSocket for server push

    1、add manager push message to login user.
    2、add user could receive message notify in page when user is online.
    3、add message insert current page when user in message handle page.

#### 2019.01.15

add remote file system, new file name style, and so forth.

    (1) site module
    1、add js/css refresh args config support - "ServerConfig.xml#site_cdn_addr_args".
    2、add support server push config to users - "ServerConfig.xml#site_client_config".
    3、replace "px" to "em" to define the size of the element so that the display size is the same at different pix.
    4、modify page allow user zoom.
    5、add gzip compression annotation and add to some special requests.
    6、optimize the api for getting the rank list in the Cache.
    7、add md5 tool in FileUtil.
    8、modify help article id config func.
    9、add new query ip location callback.
    10、enhanced verification code verification security.
    >
    (2) file module
    1、optimize the code structure in file service.
    2、add remote file system interface.
    2、add remote file system implement base aliyun oss - "ServerConfig.xml#remote_oss_config_location, oss.properties".
    3、add a my cloud share token page for aliyun oss.
    4、upgrade file name old style to new style.
        set "true" for "site_allow_run_upgrade" in ServerConfig.xml,
        then run "http://hostname/manager.do?method=upgradeNewFileNameStyle" to upgrade.
    >
    (3) album module
    1、add photo preview compress setting - "ServerConfig.xml#cloud_photo_preview_args".
    2、add album tags support users with special setting for each tag.
    3、increased display column count in album pages for better support for retina screen.
    4、add "the displayed image pixel is different" under different column numbers.

#### 2018.12.10

add `new popup way to play video` and `article archives\tags page`
    
    (1) video module
    1、add new popup way to play video.
    2、add a play flag in photos there're the cover of video.
    3、add new control block view for video popup modal.
    4、add control auto hide after mouse does not move for a while.
    5、front end add update video modal.
    6、move album page css to style.css.
    >
    (2) article module
    1、add article archives page.
    2、add article tags page.
    3、optimize toolbar's navigation column.

#### 2018.10.27

add `mount photo support` and `local setting for each modules`
    
    (1) site front-end
    1、modify font-family in style.css
    2、replace new site background-image.
    3、add local config and config setting Visual view for modules.
    4、make the url address to match the title in some page.
    >
    (2) site backend
    1、add query ip location interface.
    2、optimize functions for recycling waste.
    3、modify the implementation of file expiration time.
    4、modify the common-lang library from 2.5 to 2.6.
    5、fixed sql injection bug
    6、enhance user data security.
    7、optimize cache data accuracy.
    >
    (3) article module
    1、fixed article update bug by manager.
    2、modify top article area for showing create_time, not update_time.
    >
    (4) album module
    1、add mount photo to another album support
    2、add a video button to the album page.
    3、modify set a more precise css height to the referenced video.
    >
    (5) search module
    1、optimize the display when an error occurs in the search.
    2、add switch for search hot key in rewriteSearch.
    3、add special char support for jquery selector.

#### 2018.08.10

add `video service` and `new notice page`

    (1) video module
    1、add video service.
    2、add an event mechanism to each module.
    3、add album_video_plugin for showing video in album.
    >
    (2) controller
    1、add a base controller
    2、modify the model keyword 'mode' to 'model'.
    >
    (3) site module
    1、modify the notice page url address.
    2、add a generic site notice page.
    3、fixed notices page highlight.js path error.
    4、modify new html footer.
    5、reformat jsp code.
    6、replace tab to four space in jsp.
    >
    (4) album module
    1、add a hidden photo switch arrow
    2、add ignore jsp space config in web.xml
    3、fixed url is incorrect when loading full data in album_photo_dashboard.
    >
    (5)search box
    1、add search box gets the focus when typing 's' or 'f'.

#### 2018.08.07

add `file recycle bin support for data recovery`

    1、add file recycle bin support for data recovery.
    2、provides recovery when deleting file images, deleting photos, updating image source files, and deleting albums.
    3、backup sql file when deleting album.
    4、reorganize the message push service.
    5、fixed send email error.

#### 2018.08.02

modify `encode regex expr implement from js to java`

    1、encode implement on backstage is more elegant and better friendly
    2、add help document for user and config help article in ServerConfig.xml
    3、add store user config in browser local
    4、modify jump page use href instead of function

#### 2018.07.31

add `update photo source file` and `remember passwords in multiple terminals` support

    (1) user module
    1、add remember passwords in multiple terminals support.
    2、add open the chat modal without the user id in the personal center.
    3、fixed expired method in login.js causes login invalidation bug.
    >
    (2) album module
    1、add update photo source file support.
    2、add album handle to album photo detail page.
    3、encode album node dom id for special char.
    4、show data loading notify for photos page.
    >
    (3) search input box
    1、add the ability to escape MySQL regex keywords.
    2、optimize tags square page search friendly.
    >
    (4) home page
    1、add keyboard controls for album show switching.
    2、add notify for switch album show.
    >
    (5) others
    1、add user defined separator char in replaceByEL util.
    2、add return notify element in common_utils's notify function.
    3、add not show notify element icon css in style.class.
    4、add url params to options for text converting voice.
    5、fixed baidu audio auth error bug.
    
#### 2018.07.12 

add `special search keywords for search` and `preload album list image size`
    
    (1) search input box
    Now, user can search exactly by special keywords in input box.
    1、add EL expr replace util in common_utils.js
    2、add EL expr support in search box for ignore keyword symbol
    3、add regex search support to some properties in articles and photos
    4、add multiple matches to a single attribute
    5、modify the search function structure to modular
    >
    (2) mybatis / sql injection
    1、fixed mybatis sql injection bug
    2、fixed permission bug in user pattern match search
    >
    (3) album module
    1、add preload image size support for album list page
    2、add more photo tags separator support
    3、add EL expr support in photo tags input for ignore keyword symbol
    4、optimize something in album handle
    5、show album name in homepage photos show.
    6、fixed cover error after creating album.
    >
    (4) others
    1、fixed bug that prints password in log file
    2、add version verification for periodCache object
    3、Change config cache map's base path to absolute path

#### 2018.01.21

add album service

#### 2017.04.21

design caching system

#### 2016.09.01

complete basic function code writing
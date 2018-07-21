# imcoder-blog

Java博客  

demo: [https://imcoder.site](https://imcoder.site "imcoder.site")

## develop log

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
# imcoder-blog

Java博客  

demo: [https://imcoder.site](https://imcoder.site "imcoder.site")

## develop log

#### 2018.07.12 

add special search keywords for search and preload album list image size
    
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

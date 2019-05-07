package site.imcoder.blog.service.impl;

import org.springframework.stereotype.Service;
import site.imcoder.blog.dao.ISiteDao;
import site.imcoder.blog.service.BaseService;
import site.imcoder.blog.service.IFileService;
import site.imcoder.blog.service.ISiteService;

import javax.annotation.Resource;

@Service("siteService")
public class SiteServiceImpl extends BaseService implements ISiteService {

    @Resource
    private ISiteDao siteDao;

    @Resource(name = "fileService")
    private IFileService fileService;

}

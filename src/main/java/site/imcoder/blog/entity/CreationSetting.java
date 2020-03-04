package site.imcoder.blog.entity;

/**
 * 作品的一些追加设置
 * 基本采取默认值为false的原则
 *
 * @author Jeffrey.Deng
 * @date 2020-03-09
 */
public class CreationSetting {

    /**
     * 禁止查看（打开），（作者和管理员可以，当然前提是管理员有作品查看权限）
     */
    private Boolean disable_view;

    /**
     * 禁止发送评论
     */
    private Boolean disable_send_comment;

    /**
     * 禁止查看评论
     */
    private Boolean disable_list_comment;

    /**
     * 禁止嵌入
     */
    private Boolean disable_embed;

    public CreationSetting() {
    }

    public Boolean getDisable_view() {
        return disable_view;
    }

    public void setDisable_view(Boolean disable_view) {
        this.disable_view = disable_view;
    }

    public Boolean getDisable_send_comment() {
        return disable_send_comment;
    }

    public void setDisable_send_comment(Boolean disable_send_comment) {
        this.disable_send_comment = disable_send_comment;
    }

    public Boolean getDisable_list_comment() {
        return disable_list_comment;
    }

    public void setDisable_list_comment(Boolean disable_list_comment) {
        this.disable_list_comment = disable_list_comment;
    }

    public Boolean getDisable_embed() {
        return disable_embed;
    }

    public void setDisable_embed(Boolean disable_embed) {
        this.disable_embed = disable_embed;
    }
}

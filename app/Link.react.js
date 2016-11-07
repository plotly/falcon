function Link(props) {
    const {href, children} = props;
    try {
        const electron = require('electron');
        return <a onclick={electron.openExternal(href)}>{children}</a>
    } catch(e) {
        return <a href={href} target="_blank">{children}</a>;
    }
}

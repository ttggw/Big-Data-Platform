module.exports = {
    title: "How To Build Your Hadoop Cluster",
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Downloads', link: '/Download/' },
        {
            text: 'Buid',
            ariaLabel: 'Buid Guidence',
            items: [
              { text: 'Hadoop', link: '/Hadoop/' },
              { text: 'HBase', link: '/HBase/' },
              { text: 'Hive', link: '/Hive/' },
              { text: 'Spark', link: '/Spark/' },
            ]
          },
        { text: 'Q&A', link: '/Questions/'},
        { text: 'External', link: 'https://google.com' },
      ]
    },
    head: [
      [
        "meta", // 移动端禁止用户缩放
        {
          name: "viewport",
          content:
            "width=device-width,width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        }
      ],
      // ["link", { rel: "stylesheet", href: "/css/style.css" }], //
      ["script", { charset: "utf-8", src: "/js/disable-user-zoom.js" }] // 移动端,禁止用户缩放,引入你写的js
    ]
  }
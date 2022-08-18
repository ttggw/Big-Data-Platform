module.exports = {
    title: "ISME PROJECT",
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        {
            text: 'Hadoop Clusters',
            ariaLabel: 'Buid Guidence',
            items: [
              // { text: 'Hadoop', link: '/Build/Hadoop/' },
              // { text: 'HBase', link: '/Build/HBase/' },
              // { text: 'Hive', link: '/Build/Hive/' },
              { text: 'Intro', link: '/Introduction/' },
              { text: 'Build', items: [
                { text: 'Versions', link: '/Download/' },
                { text: 'Hadoop', link: '/Hadoop/' },
                { text: 'HBase', link: '/HBase/' },
                { text: 'Hive', link: '/Hive/' },
                { text: 'Spark', link: '/Spark/' },
              ] },
              { text: 'Guide', items: [
                { text: 'Hadoop', link: '/GHadoop/' },
                { text: 'HBase', link: '/GHBase/' },
                { text: 'Hive', link: '/GHive/' },
                { text: 'Spark', link: '/GSpark/' },
              ] }
            ]
          },
        { text: 'Q&A', link: '/Questions/'},
        { text: 'GitHub', link: 'https://github.com/ttggw' },
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
    ],
    base: '/'
  }
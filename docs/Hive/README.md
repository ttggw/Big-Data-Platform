---
sidebar: auto
---
# Hive安装及配置

## 一、hive安装文件的上传及解压

1. 使用xftp将下载的hive压缩文件上传到/opt/software目录下

2. 将文件解压到/opt/module目录下

   ```shell
   [chronus@hadoop102 software]$ tar -zxvf apache-hive-3.1.3-bin.tar.gz -C /opt/module/
   ```

   重命名

   ```shell
   [chronus@hadoop102 module]$ mv /opt/module/apache-hive-3.1.3-bin /opt/module/hive
   ```

3. 配置环境变量

   ```shell
   [chronus@hadoop102 ~]$ sudo vim /etc/profile.d/my_env.sh
   ```

   添加如下内容：

   ```shell
   #HIVE_HOME
   export HIVE_HOME=/opt/module/hive 
   export PATH=$PATH:$HIVE_HOME/bin
   ```

4. 让配置文件生效

   ```shell
   [chronus@hadoop102 ~]$ source /etc/profile
   ```

5. 初始化元数据库

   ```shell
   [chronus@hadoop102 hive]$ bin/schematool -dbType derby -initSchema
   ```

6. **TODO:**

   1. 集群中Hadoop、HBase和Hive都使用log4j记录日志，由于版本问题，会出现日志jar包的冲突，需要根据实际情况进行处理

   2. Hive和Hadoop的guava包版本可能不一致，在初始化元数据库时会出现如下报错：

      ```
      Exception in thread "main" java.lang.NoSuchMethodError: com.google.common.base.Preconditions.checkArgument(ZLjava/lang/String;Ljava/lang/Object;)V
      ```

      **处理办法：**

      删除低版本的guava包，将高版本的复制的低版本的目录下

## 二、启动并使用Hive

1. 启动Hive

   ```shell
   [chronus@hadoop102 hive]$ bin/hive
   ```

2. 使用hive

   ```sql
   hive> show databases; 
   hive> show tables;
   hive> create table test(id int); 
   hive> insert into test values(1); 
   hive> select * from test;
   ```

3. 在使用时可以再开一个窗口，用于监控hive.log文件

   ```shell
   [chronus@hadoop102 ~]$ tail -f /tmp/chronus/hive.log
   ```

4. **注意：** 目前设置的元数据库是derby，开启Hive后就会占用元数据库，且不与其他客户端共享数据，所以我们需要将Hive的元数据库地址改为MySQL

## 三、MySQL安装

1. 检查当前系统是否安装过MySQL

   ```shell
   [chronus@hadoop102 ~]$ rpm -qa|grep mariadb
   // 如果存在，用一下命令卸载
   [chronus@hadoop102 ~]$ sudo rpm -e --nodeps mariadb-libs
   ```

2. 将MySQL安装包上传到/opt/software目录下

3. 解压MySQL安装包

   ```shell
   [chronus@hadoop102 software]$ tar -xf mysql-5.7.28-1.el7.x86_64.rpm-bundle.tar
   ```

4. 在安装目录下执行rpm安装

   ```shell
   [chronus@hadoop102 software]$
   sudo rpm -ivh mysql-community-common-5.7.28-1.el7.x86_64.rpm 
   sudo rpm -ivh mysql-community-libs-5.7.28-1.el7.x86_64.rpm
   sudo rpm -ivh mysql-community-libs-compat-5.7.28-1.el7.x86_64.rpm 
   sudo rpm -ivh mysql-community-client-5.7.28-1.el7.x86_64.rpm
   sudo rpm -ivh mysql-community-server-5.7.28-1.el7.x86_64.rpm
   ```

   **注意：按照顺序依次执行**

   **如果Linux是最小化安装的，在安装mysql-community-server-5.7.28-1.el7.x86_64.rpm时，可能会出现如下错误**：

   ```
   警告：mysql-community-server-5.7.28-1.el7.x86_64.rpm: 头 V3 DSA/SHA1
   Signature, 密钥 ID 5072e1f5: NOKEY
   错误：依赖检测失败：
   libaio.so.1()(64bit) 被 mysql-community-server-5.7.28-1.el7.x86_64
   需要
   libaio.so.1(LIBAIO_0.1)(64bit) 被 mysql-community-server-5.7.28- 1.el7.x86_64 需要
   libaio.so.1(LIBAIO_0.4)(64bit) 被 mysql-community-server-5.7.28- 1.el7.x86_64 需要
   ```

   <font color=red>通过 yum 安装缺少的依赖,然后重新安装 mysql-community-server-5.7.28-1.el7.x86_64 即可</font>

   ```shell
   [chronus@hadoop102 software] yum install -y libaio 
   ```

5. 删除/var/lib/mysql目录下的所有内容

   ```shell
   [chronus@hadoop102 mysql]# cd /var/lib/mysql
   [chronus@hadoop102 mysql]# sudo rm -rf ./*
   ```

6. 初始化数据库

   ```shell
   [chronus@hadoop102 software]$ sudo mysqld --initialize --user=mysql
   ```

7. 查看临时生成的密码

   ```shell
   [chronus@hadoop102 log]$ sudo cat /var/log/mysqld.log 
   ```

    ![image-20220507112349971](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220507112349971.png)

8. 启动MySQL服务

   ```shell
   [chronus@hadoop102 ~]$ sudo systemctl start mysqld
   ```

9. 登录MySQL数据库

   ```shell
   [chronus@hadoop102 ~]$ mysql -uroot -p
   Enter password: 
   ```

   在`Enter password: `后面输入临时生成的密码

10. 修改root用户的密码

    ```sql
    mysql> set password = password("新密码"); 
    ```

## 四、Hive元数据配置到MySQL

1. 上传MySQL的JDBC驱动

2. 拷贝驱动到Hive的lib目录下

   ```shell
   [chronus@hadoop102 software]$ cp mysql-connector-java-5.1.37.jar $HIVE_HOME/lib
   ```

3. 配置Metastore到MySQL

   1. 在hive的conf目录下新建hive-site.xml文件

      ```shell
      [chronus@hadoop102 hive]$ vim conf/hive-site.xml
      ```

      添加如下内容

      ```xml
      <?xml version="1.0"?>
      <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
      <configuration>
          <!-- jdbc 连接的 URL -->
          <property>
              <name>javax.jdo.option.ConnectionURL</name>
              <value>jdbc:mysql://hadoop102:3306/metastore?useSSL=false</value>
          </property>
      
          <!-- jdbc 连接的 Driver-->
          <property>
              <name>javax.jdo.option.ConnectionDriverName</name>
              <value>com.mysql.jdbc.Driver</value>
          </property>
      
          <!-- jdbc 连接的 username-->
          <property>
              <name>javax.jdo.option.ConnectionUserName</name>
              <value>root</value>
          </property>
      
          <!-- jdbc 连接的 password -->
          <!-- 密码与mysql设置的密码一致-->
          <property>
              <name>javax.jdo.option.ConnectionPassword</name>
              <value>000000</value>
          </property>
      
          <!-- Hive 元数据存储版本的验证 -->
          <property>
             <name>hive.metastore.schema.verification</name>
             <value>false</value>
          </property>
      
          <!--元数据存储授权-->
          <property>
              <name>hive.metastore.event.db.notification.api.auth</name>
              <value>false</value>
          </property>
      
          <!-- Hive 默认在 HDFS 的工作目录 -->
          <property>
              <name>hive.metastore.warehouse.dir</name>
              <value>/user/hive/warehouse</value>
          </property>
      <configuration>
      ```

   2. 登录MySQL

      ```shell
      [chronus@hadoop102 hive]$ mysql -uroot -p000000
      ```

   3. 新建Hive元数据库

      ```sql
      mysql> create database metastore;
      mysql> quit;
      ```

   4. 初始化元数据库

      ```shell
      [chronus@hadoop102 hive]$ schematool -initSchema -dbType mysql -verbos
      ```

## 五、使用元数据服务的方式访问Hive

1. 在hive-site.xml中增加如下配置信息

   ```xml
   <!-- 指定存储元数据要连接的地址 -->
   <property>
   	<name>hive.metastore.uris</name>
   	<value>thrift://hadoop102:9083</value>
   </property>
   ```

2. 启动metastore

   ```shell
   [chronus@hadoop102 hive]$ bin/hive --service metastore
   ```

   注意：这是个前台进程，启动后不能退出，需要另开一个窗口

3. 启动hive

   ```shell
   [chronus@hadoop102 hive]$ bin/hive
   ```

## 六、使用JDBC方式访问Hive

1. 在hive-site.xml中增加如下配置信息

   ```xml
   <!-- 指定 hiveserver2 连接的 host -->
   <property>
   	<name>hive.server2.thrift.bind.host</name>
   	<value>hadoop102</value>
   </property>
   
   <!-- 指定 hiveserver2 连接的端口号 -->
   <property>
   	<name>hive.server2.thrift.port</name>
   	<value>10000</value>
   </property>
   ```

2. 启动hiveserver2

   ```shell
   [chronus@hadoop102 hive]$ bin/hive --service hiveserver2
   ```

3. 检查是否启动完成

   ```shell
   [chronus@hadoop102 hive]$ sudo netstat -anp | grep 10000
   ```

   如果查到端口，则可以进行下一步

4. 启动beeline服务器

   ```shell
   [chronus@hadoop102 hive]$ bin/beeline -u jdbc:hive2://hadoop102:10000 -n chronus
   ```

5. 这里会出现报错：

   ```
   Error: Could not open client transport with JDBC Uri: jdbc:hive2://hadoop102:10000: Failed to open new session: java.lang.RuntimeException
   ```

   是因为Hadoop的core-site.xml缺少配置文件，代理对象设置为自己的用户名(即上面-n后面的字符串)

   在core-site.xml中田间如下内容，就可以了(***是自己的用户名)

   ```
   <property>
       <name>hadoop.proxyuser.***.hosts</name>
       <value>*</value>
   </property>
       
   <property>
       <name>hadoop.proxyuser.***.groups</name>
       <value>*</value>
   </property>
   ```

   最后重启一下Hadoop集群

6. 看到如下界面就可以了

   ![image-20220507115508185](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220507115508185.png)

## 七、编写Hive服务启停脚本

1. 在hive的bin目录中新建hiveservice.sh

   ```
   [chronus@hadoop102 hive]$ vim bin/hiveservices.sh
   ```

   写入以下内容

   ```shell
   #!/bin/bash
   HIVE_LOG_DIR=$HIVE_HOME/logs
   if [ ! -d $HIVE_LOG_DIR ]
   then
       mkdir -p $HIVE_LOG_DIR
   fi
   
   function check_process()
   {
       pid=$(ps -ef 2>/dev/null | grep -v grep | grep -i $1 | awk '{print $2}')
       ppid=$(netstat -nltp 2>/dev/null | grep $2 | awk '{print $7}' | cut -d '/' -f 1)
       echo $pid
       [[ "$pid" =~ "$ppid" ]] && return 0 || return 1
   }
   
   function hive_start()
   {
       metapid=$(check_process HiveMetastore 9083)
       cmd="nohup hive --service metastore >$HIVE_LOG_DIR/metastore.log 2>&1 &"
       [ -z "$metapid" ] && eval $cmd || echo "Metastore服务已启动"
       server2pid=$(check_process HiveServer2 10000)
       cmd="nohup hiveserver2 >$HIVE_LOG_DIR/hiveServer2.log 2>&1 &"
       [ -z "$server2pid" ] && eval $cmd || echo "HiveServer2服务已启动"
   }
   
   function hive_stop()
   {
       metapid=$(check_process HiveMetastore 9803)
       [ "$metapid" ] && kill $metapid || echo "Metastore服务未启动"
       server2pid=$(check_process HiveServer2 10000)
       [ "$server2pid" ] && kill $server2pid || echo "HiveServer2服务未启动"
   }
   
   case $1 in
   "start")
       hive_start
       ;;
   "stop")
       hive_stop
       ;;
   "restart")
       hive_stop
       sleep 2
       hive_start
       ;;
   "status")
       check_process HiveMetastore 9083 >/dev/null && echo "Metastore服务运行正常" || echo "Metastore服务运行异常"
       check_process HiveServer2 10000 >/dev/null && echo "HiveServer2服务运行正常" || echo "HiveServer2服务运行异常"
       ;;
   *)
       echo Invalid Args!
       echo 'Usage: '$(basename $0)' start|stop|restart|status'
       ;;
   esac
   ```

2. 添加执行权限

   ```shell
   [chronus@hadoop102 hive]$ chmod 777 bin/hiveservices.sh
   ```
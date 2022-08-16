---
sidebar: auto
---
# Hbase安装及配置

## 一、启动Hadoop集群

1. 群起Hadoop集群

   ```shell
   [chronus@hadoop102 ~]$ myhadoop.sh start
   ```

2. 查看Java进程，确认集群启动成功

   ```shell
   [chronus@hadoop102 ~]$ jpsall
   ==================== hadoop102 ====================
   2036 NameNode
   2184 DataNode
   2651 JobHistoryServer
   2510 NodeManager
   3439 Jps
   ==================== hadoop103 ====================
   1922 DataNode
   2264 NodeManager
   2123 ResourceManager
   3019 Jps
   ==================== hadoop104 ====================
   2528 Jps
   2054 SecondaryNameNode
   1928 DataNode
   2152 NodeManager
   ```

## 二、HBase文件上传及解压

1. 通过xshell的ftp功能，将下载好的HBase安装文件上传到hadoop102的/opt/software目录下

2. 解压HBase到/opt/module目录下

   ```shell
   [chronus@hadoop102 software]$ tar -zxvf hbase-2.4.11-bin.tar.gz -C /opt/module
   ```

   重命名(可选可不选)

   ```shell
   [chronus@hadoop102 module]$ mv /opt/module/hbase-2.0.5 /opt/module/hbase
   ```

## 三、配置HBase

1. 配置环境变量：

   ```shell
   [chronus@hadoop102 ~]$ sudo vim /etc/profile.d/my_env.sh
   ```

   添加

   ```shell
   #HBASE_HOME
   export HBASE_HOME=/opt/module/hbase
   export PATH=$PATH:$HBASE_HOME/bin
   ```

2. 修改hbase-site.xml

   1. 打开hbase-site.xml文件

      ```shell
      [chronus@hadoop102 ~]$ vim /opt/module/hbase/conf/hbase-site.xml
      ```

   2. hbase-site.xml修改内容

      ```xml
      <configuration>
      <property>
          <name>hbase.rootdir</name>
          <value>hdfs://hadoop102:8020/hbase</value>
      </property>
      
      <property>
          <name>hbase.cluster.distributed</name>
          <value>true</value>
      </property>
      
      <property>
          <name>hbase.zookeeper.quorum</name>
          <value>hadoop102,hadoop103,hadoop104</value>
      </property>
      
      <property>
          <name>hbase.unsafe.stream.capability.enforce</name>
          <value>false</value>
      </property>
      <property>
          <name>hbase.wal.provider</name>
          <value>filesystem</value>
      </property>
      </configuration>
      ```

3. 更改regionservers

   ```shell
   [chronus@hadoop102 ~]$ vim /opt/module/hbase/conf/regionservers
   ```

   内容更改为：

   ```
   hadoop102
   hadoop103
   hadoop104
   ```

4. 分发Hbase到其他服务器

   ```shell
   [chronus@hadoop102 ~]$ xsync /opt/module/hbase/
   ```

## 四、HBase服务的启动

1. 群起

   ```shell
   [chronus@hadoop102 hbase]$ bin/start-hbase.sh
   ```

   停止

   ```shell
   [chronus@hadoop102 hbase]$ bin/stop-hbase.sh
   ```

2. 也可以自己编写脚本

   在/home/chronus/bin目录下新建myhbase.sh文件

   ```shell
   [chronus@hadoop102 bin]$ vim myhbase.sh
   ```

   写入以下内容

   ```shell
   if [ $# -lt 1 ]
   then
       echo "No Args Input..."
       exit ;
   fi
   
   case $1 in
   "start")
           echo " ==================== start ==================="
           ssh hadoop102 "/opt/module/hbase/bin/start-hbase.sh"
   ;;
   "stop")
          echo " ==================== stop ===================="
          ssh hadoop102 "/opt/module/hbase/bin/stop-hbase.sh"
   ;;
   *)
       echo "Input invalid Args..."
   ;;
   esac
   ```

   给予脚本执行权限

   ```shell
   [chronus@hadoop102 bin]$ chmod 777 myhadoop.sh
   ```

   分发脚本

   ```shell
   [chronus@hadoop102 ~]$ xsync bin
   ```
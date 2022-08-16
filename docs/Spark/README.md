---
sidebar: auto
---
# Spark集群的安装配置

## 一、Scala安装配置

### 1 安装Scala

1. 使用xftp将下载好的Scala安装包上传到hadoop102的/opt/software目录下

2. 解压安装包到/opt/module目录下

   ```shell
   [chronus@hadoop102 software]$ tar -zxvf scala-2.12.15.tgz -C /opt/module/
   ```

   并将目录改成scala

### 2 配置环境变量

1. 打开my_env.sh文件

   ```shell
   [chronus@hadoop102 ~]$ sudo vim /etc/profile.d/my_env.sh
   ```

2. 输入以下内容

   ```
   #SCALA_HOME
   export SCALA_HOME=/opt/module/scala
   export PATH=$PATH:$SCALA_HOME/bin
   ```

### 3 打开scala

启动Scala确认安装成功

 ![image-20220511222849953](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220511222849953.png)

输入:q退出

## 二、 安装Spark

### 1 下载Spark安装包

1. 前往[下载页面](https://mirrors.tuna.tsinghua.edu.cn/apache/spark/spark-2.4.8/)，选择 spark-2.4.8-bin-hadoop2.7.tgz 

2. 使用xftp将安装包上传到hadoop102的/opt/software目录下

3. 解压安装包, 并重命名为spark

   ```shell
   [chronus@hadoop102 software]$ tar -zxvf spark-2.4.8-bin-hadoop2.7.tgz -C /opt/module/
   ```

### 2 配置环境变量

1. 打开my_env.sh文件

   ```shell
   [chronus@hadoop102 ~]$ sudo vim /etc/profile.d/my_env.sh
   ```

2. 输入以下内容

   ```
   #SPARK_HOME
   export SPARK_HOME=/opt/module/spark
   export PATH=$PATH:$SPARK_HOME/bin
   export PATH=$PATH:$SPARK_HOME/sbin
   ```

3. 验证安装是否完成

   ```shell
   [chronus@hadoop102 ~]$ spark-shell
   ```

   如果出现如下界面，则安装成功

    ![image-20220511223739728](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220511223739728.png)

### 3 PySpark

1. centos系统一般自带python2，可以使用如下方法检查python版本

   ```shell
   [chronus@hadoop102 ~]$ python --version
   ```

2. 启动PySpark

   ```shell
   [chronus@hadoop102 ~]$ pyspark
   ```

   出现如下界面

    ![image-20220511224036570](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220511224036570.png)

## 三、构建Spark Standalone Cluster

### 1 修改spark-env.sh

1. 找到`/opt/module/spark/conf`下的spark-env.sh.template文件，将其文件名修改为spark-env.sh

   ```shell
   mv /opt/module/spark/conf/spark-env.sh.template /opt/module/spark/conf/spark-env.sh
   ```

2. 打开该文件

   ```shell
   [chronus@hadoop102 ~]$ cd /opt/module/spark/conf/
   [chronus@hadoop102 conf]$ vim spark-env.sh
   ```

3. 增加如下内容

   ```shell
   export JAVA_HOME=/opt/module/jdk1.8.0_212
   export SCALA_HOME=/opt/module/scala
   export HADOOP_HOME=/opt/module/hadoop-3.1.3
   export HADOOP_CONF_DIR=/opt/module/hadoop-3.1.3/etc/hadoop
   export HADOOP_YARN_CONF_DIR=/opt/module/hadoop-3.1.3/etc/hadoop
   export SPARK_MASTER_IP=hadoop102
   export SPARK_MASTER_HOST=hadoop102
   export SPARK_MASTER_PORT=7077
   export SPARK_MASTER_WEBUI_PORT=8080
   export SPARK_LOCAL_IP=hadoop102(在其他服务器上为该服务器的ip)
   export SPARK_WORKER_MEMORY=512m
   export SPARK_WORKER_CORES=1
   export SPARK_WORKER_INSTANCES=3
   export SPARK_EXECUTOR_MEMORY=512m
   export SPARK_DRIVER_MEMORY=512m
   export SPARK_HOME=/opt/module/spark
   export SPARK_DIST_CLASSPATH=$(/opt/module/hadoop-3.1.3/bin/hadoop classpath)
   ```

4. 配置slaves文件

   ```shell
   [chronus@hadoop102 ~]$ vim /opt/module/spark/conf/slaves
   ```

   注释掉`localhost`，将集群中的服务器写入，注意不要有空格和空行

5. 将sbin文件夹中start-all.sh和stop-all.sh改名为stark/stop-spark，避免命令重复

6. 分发scala和spark

   ```shell
   [chronus@hadoop102 module]$ xsync spark scala
   ```

7. 注意更改spark-env.sh中的loca_ip

## 四、在Spark Standalone 上运行pyspark

### 1 启动集群

1. 输入启动命令

   ```shell
   [chronus@hadoop102 ~]$ start-spark.sh
   ```

2. 注意：在启动时可能会出现`ERROR: node02:Cannot set priority of xxxxxxx process on PID xxxx `这样的报错

   1. 首先修改hadoop的hdfs文件

      ```shell
      [chronus@hadoop102 ~]$ vim /opt/module/hadoop-3.1.3/bin/hdfs
      ```

      将文件的第一行代码修改为：

      ```shell
      HADOOP_SHELL_EXECNAME="chronus"
      ```

   2. 修改hadoop的hadoop-env.sh文件

      ```shell
      [chronus@hadoop102 ~]$ vim /opt/module/hadoop-3.1.3/etc/hadoop/hadoop-env.sh 
      ```

      增加如下内容

      ```shell
      export HDFS_NAMENODE_USER=chronus
      export HDFS_DATANODE_USER=chronus
      export HDFS_SECONDARYNAMENODE_USER=chronus
      export YARN_RESOURCEMANAGER_USER=chronus
      export YARN_NODEMANAGER_USER=chronus
      ```

   3. 注意这些代码中的chronus可以更改为自己的系统用户名

### 2 运行pyspark

1. 启动pyspark

   ```shell
   [chronus@hadoop102 ~]$ pyspark --master spark://hadoop102:7077
   ```

2. 测试代码

   ```python
   >>> text = sc.textFile("file:/opt/module/spark/README.md")
   >>> text.count()
   104                                                                             
   >>> 
   ```

### 3 SPARK WEB UI界面

进入网址: http://hadoop102:8080

### 4 关闭集群

```shell
[chronus@hadoop102 ~]$ stop-spark.sh
```


---
sidebar: auto
---
# Hadoop集群搭建

## 一、虚拟机及Linux

### 1.1 系统配置

- Linux版本：centos 7.5
- 配置：2核4线程CPU，4Gb RAM，50Gb硬盘(1Gb \boot, 4Gb swap, 45Gb 根目录)

### 1.2 IP配置

需要配置VMware，hadoop100以及window的IP地址

#### VMware 虚拟网络配置

 ![image-20220430193009748](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220430193009748.png)

 ![image-20220430193226326](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220430193226326.png)

#### Windows 网络适配器设置

控制面板 网络和Internet 网络链接，右键VMnet8，选择属性，点击IPV4，按下图设置：

 ![image-20220430193614778](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220430193614778.png)

#### Hadoop100配置网络

保证Linux系统ifcfg-ens33文件中IP地址、虚拟网络编辑器地址和Windows系统VM8网络IP地址相同

在root中输入`vim /etc/sysconfig/network-scripts/ifcfg-ens33`

 ![image-20220430194209333](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220430194209333.png)

#### 修改主机名及映射

1. 修改主机名：

```shell
[root@hadoop100 ~]# vim /etc/hostname
hadoop100
```

2. 配置Linux克隆机主机名称映射hosts文件，打开/etc/hosts

```shell
[root@hadoop100 ~]# vim /etc/hosts
```

添加如下内容：

```
192.168.10.100 hadoop100
192.168.10.101 hadoop101
192.168.10.102 hadoop102
192.168.10.103 hadoop103
192.168.10.104 hadoop104
192.168.10.105 hadoop105
192.168.10.106 hadoop106
192.168.10.107 hadoop107
192.168.10.108 hadoop108
```

最后reboot

### 1.3 完善模板虚拟机环境

1. 安装epel-release

   ```shell
   [root@hadoop100 ~]# yum install -y epel-release
   ```

​	**注意**：在执行yum命令时，可能会出现pid被锁定的情况，如下图

![image-20220430202501756](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220430202501756.png)

​	此时，只需要kill该进程，输入`kill -9 pid`，其中pid为具体进程ID

2. 关闭防火墙和防火墙自启

   ```shell
   [root@hadoop100 ~]# systemctl stop firewalld
   [root@hadoop100 ~]# systemctl disable firewalld.service
   ```

3. 配置chronus用户具有root权限，方便后期加sudo执行root权限的命令

   ```shell
   [root@hadoop100 ~]# vim /etc/sudoers
   ```

   修改/etc/sudoers文件，在%wheel这行下面添加一行，如下所示：

   ```shell
   ## Allow root to run any commands anywhere
   root    ALL=(ALL)     ALL
   
   ## Allows people in group wheel to run all commands
   %wheel  ALL=(ALL)       ALL
   chronus   ALL=(ALL)     NOPASSWD:ALL
   ```

   注意：chronus这一行不要直接放到root行下面，因为所有用户都属于wheel组，你先配置了chronus具有免密功能，但是程序执行到%wheel行时，该功能又被覆盖回需要密码。所以chronus要放到%wheel这行下面。

4. 在/opt目录下创建文件夹，并修改所有者和所属组

   1. 在/opt目录下创建module、software文件夹

   ```shell
   [root@hadoop100 ~]# mkdir /opt/module
   [root@hadoop100 ~]# mkdir /opt/software
   ```

   2. 修改module、software文件夹的所有者和所属组均为chronus用户

   ```shell
   [root@hadoop100 ~]# chown atguigu:atguigu /opt/module 
   [root@hadoop100 ~]# chown atguigu:atguigu /opt/software
   ```

5. 卸载虚拟机自带的JDK

   ```shell
   [root@hadoop100 ~]# rpm -qa | grep -i java | xargs -n1 rpm -e --nodeps 
   ```

   - rpm -qa：查询所安装的所有rpm软件包
   - grep -i：忽略大小写
   - xargs -n1：表示每次值传递一个参数
   - rpm -e --nodeps：强制卸载软件

6. 重启虚拟机

### 1.4 克隆虚拟机

1. 利用模板机hadoop100，克隆三台虚拟机：hadoop102 hadoop103 hadoop104

   注意：克隆前先关机hadoop100

2. 修改克隆机IP，以hadoop102为例：

   1. 修改克隆虚拟机静态IP

   ```shell
   [root@hadoop102 ~]# vim /etc/sysconfig/network-scripts/ifcfg-ens33
   ```

   ​	将其中IPADDR改为192.168.10.102

## 二、安装JDK

1. 只需要在hadoop102上安装，其他两个虚拟机以拷贝的方式安装

2. 用xftp工具将JDK导入到opt目录下的software文件夹下面

3. 解压JDK到opt目录下的module文件夹下面

   ```shell
   [chronus@hadoop102 software]$ tar -zxvf jdk-8u212-linux-x64.tar.gz -C /opt/module/
   ```

4. 配置JAVA环境变量

   1. 新建 etc/profile.d/my_env.sh文件

   ```shell
   [chronus@hadoop102 ~]$ sudo vim /etc/profile.d/my_env.sh
   ```

   ​	添加如下内容：

   ```shell
   #JAVA_HOME
   export JAVA_HOME=/opt/module/jdk1.8.0_212
   export PATH=$PATH:$JAVA_HOME/bin
   ```

   2. 让新的环境变量生效

   ```shell
   [chronus@hadoop102 ~]$ source /etc/profile
   ```

5. 测试JAVA是否安装成功

   ```shell
   [chronus@hadoop102 ~]$ java -version
   ```

   若看到如下结果，则表示安装成功

   ```shell
   java version "1.8.0_212"
   ```

## 三、安装hadoop

Hadoop下载地址：[https://archive.apache.org/dist/hadoop/common/hadoop-3.1.3/](https://archive.apache.org/dist/hadoop/common/hadoop-2.7.2/)

1. 用xftp工具将**hadoop-3.1.3.tar.gz**导入到opt目录下的software文件夹下面

2. 解压安装文件到opt/module

   ```shell
   [chronus@hadoop102 software]$ tar -zxvf hadoop-3.1.3.tar.gz -C /opt/module/
   ```

3. 将Hadoop添加到环境变量

   1. 打开 etc/profile.d/my_env.sh文件

   ```shell
   [chronus@hadoop102 ~]$ sudo vim /etc/profile.d/my_env.sh
   ```

   添加如下内容：

   ```shell
   #HADOOP_HOME
   export HADOOP_HOME=/opt/module/hadoop-3.1.3
   export PATH=$PATH:$HADOOP_HOME/bin
   export PATH=$PATH:$HADOOP_HOME/sbin
   ```

   2. 让修改后的文件生效

   ```shell
   [chronus@hadoop102 ~]$ source /etc/profile
   ```

4. 测试是否安装成功

   ```shell
   [atguigu@hadoop102 hadoop-3.1.3]$ hadoop version
   Hadoop 3.1.3
   ```

5. 重启(如果hadoop命令不能用再重启虚拟机)

## 四、Hadoop目录结构

## 4.1 查看Hadoop目录结构

```
[chronus@hadoop102 hadoop-3.1.3]$ ll
总用量 176
drwxr-xr-x. 2 chronus chronus    183 9月  12 2019 bin
drwxr-xr-x. 3 chronus chronus     20 9月  12 2019 etc
drwxr-xr-x. 2 chronus chronus    106 9月  12 2019 include
drwxr-xr-x. 3 chronus chronus     20 9月  12 2019 lib
drwxr-xr-x. 4 chronus chronus    288 9月  12 2019 libexec
-rw-rw-r--. 1 chronus chronus 147145 9月   4 2019 LICENSE.txt
-rw-rw-r--. 1 chronus chronus  21867 9月   4 2019 NOTICE.txt
-rw-rw-r--. 1 chronus chronus   1366 9月   4 2019 README.txt
drwxr-xr-x. 3 chronus chronus   4096 9月  12 2019 sbin
drwxr-xr-x. 4 chronus chronus     31 9月  12 2019 share
```

## 4.2 重要目录

1. **bin目录**：存放对Hadoop相关服务（hdfs，yarn，mapred）进行操作的脚本
2. **etc目录**：Hadoop的配置文件目录，存放Hadoop的配置文件
3. lib目录：存放Hadoop的本地库（对数据进行压缩解压缩功能）
4. **sbin目录**：存放启动或停止Hadoop相关服务的脚本
5. share目录：存放Hadoop的依赖jar包、文档、和官方案例

## 五、完全分布式hadoop

流程：

1. 准备3台客户机（<font color=red>关闭防火墙、静态IP、主机名称</font>）
2. 安装JDK
3. 配置环境变量
4. 安装Hadoop
5. 配置环境变量
6. 配置集群
7. 单点启动
8. 配置ssh
9. 群起并测试集群

### 5.1 编写集群分发脚本xsync

#### 5.1.1 scp(secure copy)安全拷贝

1. 基本语法：

   ```shell
   scp -r    $pdir/$fname 			$user@$host:$pdir/%fname
   命令 递归	要拷贝的文件路径/名称		目的地用户@主机:目的地路径/名称
   ```

2. 实操：

   **前提：**在hadoop102、hadoop103、hadoop104都已经创建好的/opt/module、/opt/software两个目录，并且已经把这两个目录修改为chronus:chronus

   ```shell
   sudo chown atguigu:atguigu -R /opt/module
   ```

   - 在hadoop102上，将hadoop102中/opt/module/jdk1.8.0_212目录拷贝到hadoop103上

   ```shell
   [chronus@hadoop102 ~]$ scp -r /opt/module/jdk1.8.0_212  atguigu@hadoop103:/opt/module
   ```

   - 在hadoop103上，将hadoop102中/opt/module/hadoop-3.1.3目录拷贝到hadoop103上

   ```shell
   [chronus@hadoop103 ~]$ scp -r atguigu@hadoop102:/opt/module/hadoop-3.1.3 /opt/module/
   ```

   - 在hadoop103上操作，将hadoop102中/opt/module目录下所有目录拷贝到hadoop104上

   ```shell
   [chronus@hadoop103 opt]$ scp -r atguigu@hadoop102:/opt/module/* atguigu@hadoop104:/opt/module
   ```



#### 5.1.2 rsync远程同步工具

- rsync主要用于备份和镜像。具有速度快、避免复制相同内容和支持符号链接的优点。

- rsync和scp区别：用rsync做文件的复制要比scp的速度快，rsync只对差异文件做更新。scp是把所有文件都复制过去。

1. 基本语法

   ```shell
   rsync -av 		$pdir/$fname 		$user@host:$pdir/$fname
   命令	 选项参数	要拷贝的文件路径/名称	  目的地用户@主机:目的地路径/名称
   ```

   选项参数说明：

   | 选项 | 功能         |
   | ---- | ------------ |
   | -a   | 归档拷贝     |
   | -v   | 显示复制过程 |

2. 实操

   1. 删除hadoop103中/opt/module/hadoop-3.1.3/wcinput和wcoutput

      ```shell
      [chronus@hadoop103 hadoop-3.1.3]$ rm -rf wcinput/ wcoutput/
      ```

   2. 同步hadoop102中的/opt/module/hadoop-3.1.3到hadoop103

      ```shell
      [chronus@hadoop102 module]$ rsync -av hadoop-3.1.3/ atguigu@hadoop103:/opt/module/hadoop-3.1.3/
      ```


#### 5.1.3 xsync集群分发脚本

1. 需求：循环复制文件到所有节点的相同目录下

2. 需求分析：

   1. 期望脚本

      ```shell
      xsync 要同步的文件名
      ```

   2. 要将脚本放在声明了全局变量的路径中

      ```shell
      [chronus@hadoop102 ~]$ echo $PATH
      /usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/opt/module/jdk1.8.0_212/bin:/opt/module/hadoop-3.1.3/bin:/opt/module/hadoop-3.1.3/sbin:/home/chronus/.local/bin:/home/chronus/bin
      ```

      所以，我们要将脚本放在chronus/bin下面

3. 脚本实现

   1. 在home/chronus/bin目录下创建xsync文件

      ```shell
      [chronus@hadoop102 opt]$ cd /home/atguigu
      [chronus@hadoop102 ~]$ mkdir bin
      [chronus@hadoop102 ~]$ cd bin
      [chronus@hadoop102 bin]$ vim xsync
      ```

      在xsync文件中编写如下代码：

      ```shell
      #!/bin/bash
      
      #1. 判断参数个数
      if [ $# -lt 1 ]
      then
          echo Not Enough Arguement!
          exit;
      fi
      
      #2. 遍历集群所有机器
      for host in hadoop102 hadoop103 hadoop104
      do
          echo ====================  $host  ====================
          #3. 遍历所有目录，挨个发送
      
          for file in $@
          do
              #4. 判断文件是否存在
              if [ -e $file ]
                  then
                      #5. 获取父目录
                      pdir=$(cd -P $(dirname $file); pwd)
      
                      #6. 获取当前文件的名称
                      fname=$(basename $file)
                      ssh $host "mkdir -p $pdir"
                      rsync -av $pdir/$fname $host:$pdir
                  else
                      echo $file does not exists!
              fi
          done
      done
      ```

   2. 修改脚本xsync使其具有执行权限

      ```shell
      [chronus@hadoop102 bin]$ chmod 777 xsync
      ```

   3. 测试脚本

      ```shell
      [chronus@hadoop102 ~]$ xsync /home/atguigu/bin
      ```

   4. 同步环境变量配置(root所有者)

      ```shell
      [chronus@hadoop102 ~]$ sudo ./bin/xsync /etc/profile.d/my_env.sh
      ```

      **如果用了sudo，xsync一定要补全路径**

      让环境变量生效：

      ```shell
      [chronus@hadoop103 bin]$ source /etc/profile
      [chronusu@hadoop104 opt]$ source /etc/profile
      ```

### 5.2 SSH免密登录配置

#### 5.2.1 SSH配置

1. 基本语法

   ```shell
   ssh 另一台电脑的ip
   ```

2. ssh连接时出现Host key verification failed的解决方法

   ```shell
   [chronus@hadoop102 ~]$ ssh hadoop103
   ```

   - 如果出现如下内容

   ```shell
   Are you sure you want to continue connecting (yes/no)? 
   ```

   - 输入yes并回车

#### 5.2.2 无密钥配置

1. 生成公钥和私钥

   1. 找到并进入.ssh目录

   ```shell
   [chronus@hadoop102 ~]$ ls -al
   ```

    ![image-20220501145050326](C:\Users\Chronus\AppData\Roaming\Typora\typora-user-images\image-20220501145050326.png)

   ```shell
   [chronus@hadoop102 ~]$ cd .ssh/
   ```

   2. 生成公钥和私钥

   ```shell
   [chronus@hadoop102 .ssh]$ pwd
   /home/chronus/.ssh
   [chronus@hadoop102 .ssh]$ ssh-keygen -t rsa
   ```

   然后敲三个回车，就会生成两个文件，id_rsa(私钥)、id_rsa.pub(公钥)

   3. 将公钥拷贝到要免密登录的目标机器上

   ```shell
   [chronus@hadoop102 .ssh]$ ssh-copy-id hadoop102
   [chronus@hadoop102 .ssh]$ ssh-copy-id hadoop103
   [chronus@hadoop102 .ssh]$ ssh-copy-id hadoop104
   ```

   - 此外，还需要在hadoop103和hadoop104上用chronus账号配置一下到102、103、104的无密登录
   - 在hadoop102上用root账户配置一下到102、103、104的无密登录

2. .ssh文件夹下的文件功能

| 文件            | 功能                           |
| --------------- | ------------------------------ |
| konwn_hosts     | 记录ssh访问过的计算机的公钥    |
| id_rsa          | 生成的私钥                     |
| id_rsa.pub      | 生成的公钥                     |
| authorized_kets | 存放授权过的无密登录服务器公钥 |

### 5.3 集群配置

#### 5.3.1集群部署规划

注意：

- NameNode和SecondaryNameNode不要安装在同一服务器
- ResourceManager不要和NameNode及SecondaryNameNode安装在同一服务器

|      | hadoop102          | hadoop103                   | hadoop104                   |
| ---- | ------------------ | --------------------------- | --------------------------- |
| HDFS | NameNode、DataNode | DataNode                    | SecondaryNameNode、DataNode |
| YARN | NodeManage         | ResourceManager、NodeManage | NodeManage                  |

#### 5.3.2配置集群

**core-site.xml、hdfs-site.xml、yarn-site.xml、mapred-site.xml**四个配置文件存放在$HADOOP_HOME/etc/hadoop这个路径上，用户可以根据项目需求重新进行修改配置。

1. 核心配置文件

   配置core-site.xml:

   ```shell
   [chronus@hadoop102 hadoop]$ vim core-site.xml
   ```

   在configuration标签中添加入下内容

   ```xml
       <!-- 指定NameNode的地址 -->
       <property>
           <name>fs.defaultFS</name>
           <value>hdfs://hadoop102:8020</value>
       </property>
   
       <!-- 指定hadoop数据的存储目录 -->
       <property>
           <name>hadoop.tmp.dir</name>
           <value>/opt/module/hadoop-3.1.3/data</value>
       </property>
   ```

2. HDFS配置文件

   配置hdfs-site.xml

   ```shell
   [chronus@hadoop102 hadoop]$ vim hdfs-site.xml
   ```

   在configuration标签中添加入下内容

   ```xml
   	<!-- nn web端访问地址-->
   	<property>
           <name>dfs.namenode.http-address</name>
           <value>hadoop102:9870</value>
       </property>
   	<!-- 2nn web端访问地址-->
       <property>
           <name>dfs.namenode.secondary.http-address</name>
           <value>hadoop104:9868</value>
       </property>
   ```

3. YARN配置文件

   配置yarn-site.xml

   ```shell
   [chronus@hadoop102 hadoop]$ vim yarn-site.xml
   ```

   在configuration标签中添加入下内容

   ```xml
       <!-- 指定MR走shuffle -->
       <property>
           <name>yarn.nodemanager.aux-services</name>
           <value>mapreduce_shuffle</value>
       </property>
   
       <!-- 指定ResourceManager的地址-->
       <property>
           <name>yarn.resourcemanager.hostname</name>
           <value>hadoop103</value>
       </property>
   
       <!-- 环境变量的继承 -->
       <property>
           <name>yarn.nodemanager.env-whitelist</name>
           <value>JAVA_HOME,HADOOP_COMMON_HOME,HADOOP_HDFS_HOME,HADOOP_CONF_DIR,CLASSPATH_PREPEND_DISTCACHE,HADOOP_YARN_HOME,HADOOP_MAPRED_HOME</value>
       </property>
   ```

4. MapReduce配置文件

   配置mapred-site.xml

   ```shell
   [chronus@hadoop102 hadoop]$ vim mapred-site.xml
   ```

   在configuration标签中添加入下内容

   ```xml
   	<!-- 指定MapReduce程序运行在Yarn上 -->
       <property>
           <name>mapreduce.framework.name</name>
           <value>yarn</value>
       </property>
   ```

### 5.4 群起集群

#### 5.4.1配置workers

```shell
[chronus@hadoop102 hadoop]$ vim /opt/module/hadoop-3.1.3/etc/hadoop/workers
```

在该文件中增加以下内容：

```
hadoop102
hadoop103
hadoop104
```

**注意，文件中不能有空格和空行**

同步至所有节点

```shell
[chronus@hadoop102 hadoop]$ xsync /opt/module/hadoop-3.1.3/etc
```

#### 5.4.2启动集群

1. **如果集群是第一次启动**，需要在hadoop102节点格式化NameNode（注意：格式化NameNode，会产生新的集群id，导致NameNode和DataNode的集群id不一致，集群找不到已往数据。如果集群在运行过程中报错，需要重新格式化NameNode的话，一定要先停止namenode和datanode进程，并且要删除所有机器的data和logs目录，然后再进行格式化。）

   ```shell
   [chronus@hadoop102 hadoop-3.1.3]$ hdfs namenode -format
   ```

2. 启动HDFS

   ```shell
   [chronus@hadoop102 hadoop-3.1.3]$ sbin/start-dfs.sh
   ```

3. 在**配置了ResourceManager的节点(hadoop103)**启动YARN

   ```shell
   [chronus@hadoop102 hadoop-3.1.3]$ sbin/start-yarn.sh
   ```

4. web端查看HDFS的NameNode

   1. 浏览器中输入：https://hadoop102:9870
   2. 查看HDFS上存储的数据信息

5. web端查看YARN的ResourceManager

   1. 浏览器输入：https://hadoop103:8088
   2. 查看YARN上运行的Job信息

#### 5.4.3集群基本测试

1. 上传文件到集群

   - 上传小文件

   ```shell
   [chronus@hadoop102 ~]$ hadoop fs -mkdir /wcinput
   [chronus@hadoop102 ~]$ hadoop fs -put /wcinput/word.txt /wcinput
   ```

   - 上传大文件

   ```shell
   [achronus@hadoop102 ~]$ hadoop fs -put  /opt/software/jdk-8u212-linux-x64.tar.gz  /
   ```

2. 上传文件后查看文件存放在什么位置

   - 查看HDFS文件存储路径

   ```shell
   [chronus@hadoop102 subdir0]$ pwd
   /opt/module/hadoop-3.1.3/data/dfs/data/current/BP-1436128598-192.168.10.102-1610603650062/current/finalized/subdir0/subdir0
   ```

   -  查看HDFS在磁盘存储文件内容

   ```shell
   [chronus@hadoop102 subdir0]$ cat blk_1073741825
   ```

3. 拼接

   大于64mb的文件将会被拆分，所以需要拼接

   -rw-rw-r--. 1 atguigu atguigu 134217728 5月 23 16:01 **blk_1073741836**

   -rw-rw-r--. 1 atguigu atguigu  1048583 5月 23 16:01 blk_1073741836_1012.meta

   -rw-rw-r--. 1 atguigu atguigu 63439959 5月 23 16:01 **blk_1073741837**

   -rw-rw-r--. 1 atguigu atguigu  495635 5月 23 16:01 blk_1073741837_1013.meta

   ```shell
   [chronus@hadoop102 subdir0]$ cat blk_1073741836>>tmp.tar.gz
   [chronus@hadoop102 subdir0]$ cat blk_1073741837>>tmp.tar.gz
   ```

4. 执行word count程序

   ```shell
   [chronus@hadoop102 hadoop-3.1.3]$ hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.1.3.jar wordcount /wcinput /wcoutput
   ```

### 5.5 配置历史服务器

	为了查看程序的历史运行情况，需要配置一下历史服务器。具体配置步骤如下：

1. 配置mapred-site.xml:

   ```shell
   [chronus@hadoop102 hadoop]$ vim mapred-site.xml
   ```

   在文件中增加以下内容：

   ```xml
   <!-- 历史服务器端地址 -->
   <property>
       <name>mapreduce.jobhistory.address</name>
       <value>hadoop102:10020</value>
   </property>
   
   <!-- 历史服务器web端地址 -->
   <property>
       <name>mapreduce.jobhistory.webapp.address</name>
       <value>hadoop102:19888</value>
   </property>
   ```

2. 分发配置

   ```shell
   [chronus@hadoop102 hadoop]$ xsync /etc/hadoop/mapred-site.xml
   ```

3. 在hadoop102启动历史服务器

   ```shell
   [chronus@hadoop102 hadoop]$ mapred --daemon start historyserver
   ```

4. 查看历史服务器是否启动

   ```shell
   [chronus@hadoop102 hadoop]$ jps
   ```

5. 输入http://hadoop102:19888/jobhistory/查看JobHistory

### 5.6 配置日志的聚集

1. 配置yarn-site.xml

   ```shell
   [chronus@hadoop102 hadoop]$ vim yarn-site.xml
   ```

   在文件里添加入下内容：

   ```xml
   <!-- 开启日志聚集功能 -->
   <property>
       <name>yarn.log-aggregation-enable</name>
       <value>true</value>
   </property>
   <!-- 设置日志聚集服务器地址 -->
   <property>  
       <name>yarn.log.server.url</name>  
       <value>http://hadoop102:19888/jobhistory/logs</value>
   </property>
   <!-- 设置日志保留时间为7天 -->
   <property>
       <name>yarn.log-aggregation.retain-seconds</name>
       <value>604800</value>
   </property>
   ```

2. 分发配置

   ```shell
   [chronus@hadoop102 hadoop]$ xsync /etc/hadoop/yarn-site.xml
   ```

3. 关闭NodeManager、ResourceManager和HistoryServer

   ```shell
   [chronus@hadoop103 hadoop-3.1.3]$ sbin/stop-yarn.sh
   [chronus@hadoop103 hadoop-3.1.3]$ mapred --daemon stop historyserver
   ```

4. 启动NodeManager 、ResourceManage和HistoryServer

   ```shell
   [chronus@hadoop103 ~]$ start-yarn.sh
   [chronus@hadoop102 ~]$ mapred --daemon start historyserver
   ```

### 5.7 集群启动/停止

#### 5.7.1 各个模块分开启动/停止

1. 整体启动/停止HDFS

   ```shell
   start-dfs.sh/stop-dfs.sh
   ```

2. 整体启动/停止YARN

   ```shell
   start-yarn.sh/stop-yarn.sh
   ```

#### 5.7.2 各个服务组件逐一启动/停止

1. 分别启动/停止HDFS组件

   ```shell
   hdfs --daemon start/stop namenode/datanode/secondarynamenode
   ```

2. 启动/停止YARN

   ```shell
   yarn --daemon start/stop  resourcemanager/nodemanager
   ```

### 5.8 几个常用脚本

#### 5.8.1 Hadoop集群启停脚本：myhadoop.sh

1. 在chronus的bin目录中，创建myhadoop.sh

   ```shell
   [chronus@hadoop102 ~]$ cd /home/chronus/bin
   [chronus@hadoop102 bin]$ vim myhadoop.sh
   ```

2. 输入以下内容

   ```shell
   #!/bin/bash
   
   if [ $# -lt 1 ]
   then
       echo "No Args Input..."
       exit ;
   fi
   
   case $1 in
   "start")
           echo " =================== 启动 hadoop集群 ==================="
   
           echo " --------------- 启动 hdfs ---------------"
           ssh hadoop102 "/opt/module/hadoop-3.1.3/sbin/start-dfs.sh"
           echo " --------------- 启动 yarn ---------------"
           ssh hadoop103 "/opt/module/hadoop-3.1.3/sbin/start-yarn.sh"
           echo " --------------- 启动 historyserver ---------------"
           ssh hadoop102 "/opt/module/hadoop-3.1.3/bin/mapred --daemon start historyserver"
   ;;
   "stop")
           echo " =================== 关闭 hadoop集群 ==================="
   
           echo " --------------- 关闭 historyserver ---------------"
           ssh hadoop102 "/opt/module/hadoop-3.1.3/bin/mapred --daemon stop historyserver"
           echo " --------------- 关闭 yarn ---------------"
           ssh hadoop103 "/opt/module/hadoop-3.1.3/sbin/stop-yarn.sh"
           echo " --------------- 关闭 hdfs ---------------"
           ssh hadoop102 "/opt/module/hadoop-3.1.3/sbin/stop-dfs.sh"
   ;;
   *)
       echo "Input Args Error..."
   ;;
   esac
   ```

3. 保存退出后，赋予脚本执行权限

   ```shell
   [chronus@hadoop102 bin]$ chmod 777 myhadoop.sh
   ```

#### 5.8.2 查看三台服务器Java进程脚本：jpsall

1. 在chronus的bin目录中，创建jpsall

   ```shell
   [chronus@hadoop102 ~]$ cd /home/chronus/bin
   [chronus@hadoop102 bin]$ vim jpsall
   ```

2. 输入以下内容

   ```shell
   #!/bin/bash
   
   for host in hadoop102 hadoop103 hadoop104
   do
   	echo ==================== $host ====================
   	ssh $host jps
   done
   ```

3. 保存退出后，赋予脚本执行权限

   ```shell
   [chronus@hadoop102 bin]$ chmod 777 jpsall
   ```

#### 最后分发/home/chronus/bin目录

```shell
[chronus@hadoop102 ~]$ xsync /home/chronus/bin/
```

### 5.9常用端口号

| 端口名称                  | Hadoop2.x   | Hadoop3.x       |
| ------------------------- | ----------- | --------------- |
| NameNode内部通信端口      | 8020 / 9000 | 8020/ 9000/9820 |
| NameNode HTTP UI          | 50070       | 9870            |
| MapReduce查看执行任务端口 | 8088        | 8088            |
| 历史服务器通信端口        | 19888       | 19888           |
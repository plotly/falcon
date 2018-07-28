# Installation of the free Oracle Install Client

Unlike the other connectors and as of this writing, the Oracle bindings for
Node.js, [oracledb](https://www.npmjs.com/package/oracledb), do not include the
necessary Oracle Client libraries and users are required to create an account on
[Oracle](https://login.oracle.com/mysso/signon.jsp) before downloading them.

Although the installation procedure is very well documented
[here](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md#instructions),
see below a quick guide for Windows, Mac and Ubuntu.


## Windows

*(instructions taken from [oracledb](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md#364-install-the-free-oracle-instant-client-zip))*

1. Download the free 64-bit Instant Client Basic ZIP file from [Oracle Technology Network](http://www.oracle.com/technetwork/topics/winx64soft-089540.html).
2. Extract `instantclient-basic-windows.x64-12.2.0.1.0.zip` to a folder, such as `C:\oracle\instantclient_12_2`.
3. Add this folder to `PATH`. For example on Windows 7, update `PATH` in `Control Panel -> System -> Advanced System Settings -> Advanced -> Environment Variables -> System variables -> PATH` and add your path, such as `C:\oracle\instantclient_12_2`.
4. Download and install the correct Visual Studio Redistributable from Microsoft. Instant Client 12.2 requires the [Visual Studio 2013 redistributable](https://support.microsoft.com/en-us/kb/2977003#bookmark-vs2013).


## Mac

*(instructions taken from [oracledb](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md#354-install-the-free-oracle-instant-client-basic-zip-file))*

Download the free Basic 64-bit ZIP from [Oracle Technology Network](http://www.oracle.com/technetwork/topics/intel-macsoft-096467.html) and unzip it, for example: 

```
mkdir -p /opt/oracle
unzip instantclient-basic-macos.x64-12.2.0.1.0.zip
```

Create a symbolic link for the 'client shared library' in the user default library path such as in `~/lib` or `/usr/local/lib`. For example: 

```
mkdir ~/lib
ln -s instantclient_12_2/libclntsh.dylib.12.1 ~/lib/
```

Alternatively, copy the required OCI libraries, for example: 

```
mkdir ~/lib
cp instantclient_12_2/{libclntsh.dylib.12.1,libclntshcore.dylib.12.1,libons.dylib,libnnz12.dylib,libociei.dylib} ~/lib/
```


## Ubuntu

1. Install requirements: `sudo apt-get -qq update && sudo apt-get --no-install-recommends -qq install alien bc libaio1`
2. Create an account on [Oracle](https://login.oracle.com/mysso/signon.jsp)
3. Download the Oracle Instant Client from [here](http://download.oracle.com/otn/linux/oracle11g/xe/oracle-xe-11.2.0-1.0.x86_64.rpm.zip)
4. Unzip `rpm` package: `unzip oracle-xe-11.2.0-1.0.x86_64.rpm.zip`
5. Convert `rpm` package into `deb`: `alien oracle-xe-11.2.0-1.0.x86_64.rpm`
6. Install `deb` package: `sudo dpkg -i oracle-instantclient12.2-basiclite_12.2.0.1.0-2_amd64.deb`

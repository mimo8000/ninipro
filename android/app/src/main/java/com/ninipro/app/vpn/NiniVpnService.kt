package com.ninipro.app.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.ProxyInfo
import android.net.VpnService
import android.os.Build
import android.os.IBinder
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.ninipro.app.MainActivity
import io.nekohasekai.libbox.CommandServer
import io.nekohasekai.libbox.CommandServerHandler
import io.nekohasekai.libbox.ConnectionOwner
import io.nekohasekai.libbox.InterfaceUpdateListener
import io.nekohasekai.libbox.Libbox
import io.nekohasekai.libbox.LocalDNSTransport
import io.nekohasekai.libbox.NetworkInterface
import io.nekohasekai.libbox.NetworkInterfaceIterator
import io.nekohasekai.libbox.Notification as BoxNotification
import io.nekohasekai.libbox.OverrideOptions
import io.nekohasekai.libbox.PlatformInterface
import io.nekohasekai.libbox.SetupOptions
import io.nekohasekai.libbox.StringIterator
import io.nekohasekai.libbox.SystemProxyStatus
import io.nekohasekai.libbox.TunOptions
import io.nekohasekai.libbox.WIFIState
import go.Seq
import java.net.InetSocketAddress
import java.net.NetworkInterface as JavaNetworkInterface

/**
 * Real VPN service backed by the sing-box core shipped in libbox.aar.
 * Implements the libbox PlatformInterface + CommandServerHandler contracts
 * (sing-box 1.13.x ABI).
 */
class NiniVpnService : VpnService(), PlatformInterface, CommandServerHandler {

    companion object {
        const val TAG = "NiniVpn"
        const val ACTION_CONNECT = "com.ninipro.app.vpn.CONNECT"
        const val ACTION_DISCONNECT = "com.ninipro.app.vpn.DISCONNECT"
        const val EXTRA_CONFIG = "config"
        const val NOTIFICATION_ID = 1
        const val NOTIFICATION_CHANNEL = "nini_vpn"

        @JvmStatic
        internal var running: Boolean = false
            private set

        @JvmStatic
        internal var lastError: String? = null

        @JvmStatic
        fun getRunning(): Boolean = running

        @JvmStatic
        fun getLastError(): String? = lastError

        private var libboxReady = false

        // ---- live log (like ShadowRay's گزارشات) ----
        private val logLines = java.util.concurrent.ConcurrentLinkedDeque<String>()
        private const val LOG_MAX = 400

        @JvmStatic
        fun log(msg: String) {
            val line = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.US)
                .format(java.util.Date()) + "  " + msg
            logLines.addLast(line)
            while (logLines.size > LOG_MAX) logLines.pollFirst()
            Log.i(TAG, msg)
        }

        @JvmStatic
        fun getLogs(): String = logLines.joinToString("\n")

        @JvmStatic
        fun connect(context: Context, config: String) {
            val intent = Intent(context, NiniVpnService::class.java).apply {
                action = ACTION_CONNECT
                putExtra(EXTRA_CONFIG, config)
            }
            ContextCompat.startForegroundService(context, intent)
        }

        @JvmStatic
        fun disconnect(context: Context) {
            val intent = Intent(context, NiniVpnService::class.java).apply {
                action = ACTION_DISCONNECT
            }
            context.startService(intent)
        }
    }

    private var commandServer: CommandServer? = null
    private var fileDescriptor: ParcelFileDescriptor? = null
    private var profileName: String = "NiniPro"
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    @Volatile
    private var pendingListener: InterfaceUpdateListener? = null

    // ------------------------------------------------------------ lifecycle

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // NEVER let an exception escape here: onStartCommand runs on the main
        // thread and any throw kills the whole app ("برنامه دارای اشکال است").
        try {
            when (intent?.action) {
                ACTION_CONNECT -> {
                    val cfg = intent.getStringExtra(EXTRA_CONFIG)
                    if (cfg.isNullOrBlank()) {
                        lastError = "empty config"
                        NiniVpnBridge.emit("error:empty config")
                        stopSelf()
                        return START_NOT_STICKY
                    }
                    // Android 12+ requires startForeground within ~5s.
                    enterForeground("در حال اتصال…")
                    Thread { startVpn(cfg) }.start()
                }

                ACTION_DISCONNECT -> {
                    Thread {
                        stopVpn()
                        stopSelf()
                    }.start()
                }
            }
        } catch (e: Throwable) {
            lastError = e.message ?: e.javaClass.simpleName
            log("❌ خطای سرویس: ${e.javaClass.simpleName}: ${e.message}")
            runCatching { NiniVpnBridge.emit("error:" + lastError) }
            writeCrashFile(e)
            runCatching { stopSelf() }
        }
        return START_NOT_STICKY
    }

    /** Promote to foreground; tolerate failure (no notification permission etc.). */
    private fun enterForeground(text: String) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    buildNotification(profileName, text),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
                )
            } else {
                startForeground(NOTIFICATION_ID, buildNotification(profileName, text))
            }
        } catch (e: Throwable) {
            Log.e(TAG, "startForeground failed: ${e.javaClass.name}: ${e.message}", e)
            writeCrashFile(e)
            try {
                startForeground(NOTIFICATION_ID, buildNotification(profileName, text))
            } catch (e2: Throwable) {
                Log.e(TAG, "startForeground retry failed", e2)
            }
        }
    }

    private fun writeCrashFile(e: Throwable) {
        try {
            val sw = java.io.StringWriter()
            e.printStackTrace(java.io.PrintWriter(sw))
            val body = sw.toString()
            val ext = getExternalFilesDir(null)
            if (ext != null) {
                java.io.FileWriter(java.io.File(ext, "crash.log"), true).use { w ->
                    w.write("==== vpn ${System.currentTimeMillis()} ====\n")
                    w.write(body)
                    w.write("\n")
                }
            }
        } catch (ignored: Throwable) {
        }
    }

    override fun onBind(intent: Intent?): IBinder? = super.onBind(intent)

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    override fun onRevoke() {
        stopVpn()
        super.onRevoke()
    }

    private fun startVpn(config: String) {
        log("شروع اتصال — کانفیگ ${config.length} کاراکتر")
        if (running) {
            tryReload(config)
            return
        }
        try {
            // Catch ANY native/JNI throw from libbox so the app never hard-crashes.
            val thread = Thread.currentThread()
            val old = thread.uncaughtExceptionHandler
            thread.uncaughtExceptionHandler = Thread.UncaughtExceptionHandler { t, e ->
                lastError = e.message ?: e.javaClass.simpleName
                log("❌ کرش ترد VPN: ${e.javaClass.simpleName}: ${e.message}")
                writeCrashFile(e)
                NiniVpnBridge.emit("error:" + (e.message ?: e.javaClass.simpleName))
                runCatching { stopSelf() }
            }

            log("در حال آماده‌سازی هسته sing-box…")
            initializeLibbox()
            log("هسته sing-box آماده شد")
            try {
                startForeground(NOTIFICATION_ID, buildNotification(profileName, "در حال اتصال…"))
            } catch (e: Throwable) {
                Log.w(TAG, "startForeground failed: ${e.message}")
            }

            log("ساخت سرور فرمان…")
            val server = Libbox.newCommandServer(this, this)
            server.start()
            commandServer = server
            log("سرور فرمان بالا آمد")

            // Validate before starting so we surface a clear error to the UI.
            try {
                server.checkConfig(config)
            } catch (e: Throwable) {
                log("هشدار: کانفیگ نامعتبر — ${e.javaClass.simpleName}: ${e.message}")
            }

            val override = OverrideOptions()
            override.setAutoRedirect(false)
            server.startOrReloadService(config, override)

            running = true
            lastError = null
            updateNotification("متصل")
            NiniVpnBridge.emit("connected")
            log("✅ VPN برقرار شد (sing-box ${runCatching { Libbox.version() }.getOrElse { "?" }})")
            Thread.currentThread().uncaughtExceptionHandler = null
        } catch (e: Throwable) {
            lastError = e.message
            log("❌ خطای اتصال: ${e.javaClass.simpleName}: ${e.message}")
            NiniVpnBridge.emit("error:" + (e.message ?: e.javaClass.simpleName))
            stopVpn()
            stopSelf()
        }
    }

    private fun tryReload(config: String) {
        try {
            val override = OverrideOptions()
            override.setAutoRedirect(false)
            commandServer?.startOrReloadService(config, override)
            updateNotification("متصل")
            NiniVpnBridge.emit("connected")
        } catch (e: Throwable) {
            lastError = e.message
            NiniVpnBridge.emit("error:" + (e.message ?: "reload failed"))
        }
    }

    private fun stopVpn() {
        running = false
        runCatching { commandServer?.closeService() }
        runCatching { commandServer?.close() }
        commandServer = null
        runCatching { fileDescriptor?.close() }
        fileDescriptor = null
        unregisterNetwork()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        NiniVpnBridge.emit("disconnected")
    }

    private fun initializeLibbox() {
        if (libboxReady) return
        Seq.setContext(applicationContext)
        val working = getExternalFilesDir(null) ?: filesDir
        working.mkdirs()
        cacheDir.mkdirs()

        val opts = SetupOptions()
        opts.setBasePath(filesDir.absolutePath)
        opts.setWorkingPath(working.absolutePath)
        opts.setTempPath(cacheDir.absolutePath)
        opts.setFixAndroidStack(true)
        opts.setCommandServerListenPort(0)
        opts.setCommandServerSecret("")
        opts.setLogMaxLines(3000L)
        opts.setDebug(false)
        Libbox.setup(opts)
        Libbox.setMemoryLimit(true)
        runCatching { Libbox.setLocale(java.util.Locale.getDefault().toLanguageTag()) }
        libboxReady = true
        Log.i(TAG, "libbox initialised, sing-box ${runCatching { Libbox.version() }.getOrElse { "?" }}")
    }

    // ------------------------------------------------------------ notification

    private fun buildNotification(title: String, text: String): Notification {
        ensureChannel()
        val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_IMMUTABLE else 0
        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT),
            piFlags,
        )
        val stopIntent = PendingIntent.getService(
            this, 1,
            Intent(this, NiniVpnService::class.java).apply { action = ACTION_DISCONNECT },
            piFlags,
        )
        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL)
            .setOngoing(true)
            .setShowWhen(false)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(openIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "قطع", stopIntent)
            .build()
    }

    private fun updateNotification(text: String) {
        getSystemService(NotificationManager::class.java)
            .notify(NOTIFICATION_ID, buildNotification(profileName, text))
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = getSystemService(NotificationManager::class.java)
            if (mgr.getNotificationChannel(NOTIFICATION_CHANNEL) == null) {
                mgr.createNotificationChannel(
                    NotificationChannel(
                        NOTIFICATION_CHANNEL,
                        "NiniPro VPN",
                        NotificationManager.IMPORTANCE_LOW,
                    ),
                )
            }
        }
    }

    // ------------------------------------------------------------ CommandServerHandler

    override fun serviceStop() {
        stopVpn()
        stopSelf()
    }

    override fun serviceReload() {
        // Reloads are driven from the JS layer.
    }

    override fun getSystemProxyStatus(): SystemProxyStatus {
        val status = SystemProxyStatus()
        status.setAvailable(false)
        status.setEnabled(false)
        return status
    }

    override fun setSystemProxyEnabled(enabled: Boolean) {}

    override fun writeDebugMessage(message: String?) {
        val m = message ?: return
        Log.d(TAG, m)
        log(m)
    }

    // ------------------------------------------------------------ PlatformInterface

    override fun usePlatformAutoDetectInterfaceControl(): Boolean = true

    override fun autoDetectInterfaceControl(fd: Int) {
        protect(fd)
    }

    override fun openTun(options: TunOptions): Int {
        if (prepare(this) != null) throw IllegalStateException("مجوز VPN داده نشده")

        val builder = Builder()
            .setSession(profileName)
            .setMtu(options.getMTU())

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setMetered(false)
        }

        options.getInet4Address().let { it4 ->
            while (it4.hasNext()) {
                val a = it4.next()
                builder.addAddress(a.address(), a.prefix())
            }
        }
        options.getInet6Address().let { it6 ->
            while (it6.hasNext()) {
                val a = it6.next()
                builder.addAddress(a.address(), a.prefix())
            }
        }

        if (options.getAutoRoute()) {
            // libbox 1.13 exposes a single DNS server address (StringBox).
            val dnsBox = options.getDNSServerAddress()
            val dnsAddr = dnsBox?.getValue()
            if (!dnsAddr.isNullOrBlank()) {
                builder.addDnsServer(dnsAddr)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val r4 = options.getInet4RouteAddress()
                if (r4.hasNext()) {
                    while (r4.hasNext()) {
                        val a = r4.next()
                        builder.addRoute(a.address(), a.prefix())
                    }
                } else {
                    builder.addRoute("0.0.0.0", 0)
                }
                val r6 = options.getInet6RouteAddress()
                if (r6.hasNext()) {
                    while (r6.hasNext()) {
                        val a = r6.next()
                        builder.addRoute(a.address(), a.prefix())
                    }
                } else {
                    builder.addRoute("::", 0)
                }
                // exclude routes are optional for basic routing; skip to keep API-level safe
            } else {
                val r4 = options.getInet4RouteRange()
                while (r4.hasNext()) {
                    val a = r4.next()
                    builder.addRoute(a.address(), a.prefix())
                }
                val r6 = options.getInet6RouteRange()
                while (r6.hasNext()) {
                    val a = r6.next()
                    builder.addRoute(a.address(), a.prefix())
                }
            }

            val inc = options.getIncludePackage()
            if (inc.hasNext()) {
                while (inc.hasNext()) {
                    runCatching { builder.addAllowedApplication(inc.next()) }
                }
            }
            val exc = options.getExcludePackage()
            if (exc.hasNext()) {
                while (exc.hasNext()) {
                    runCatching { builder.addDisallowedApplication(exc.next()) }
                }
            }
        }

        if (options.isHTTPProxyEnabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setHttpProxy(
                ProxyInfo.buildDirectProxy(
                    options.getHTTPProxyServer(),
                    options.getHTTPProxyServerPort(),
                ),
            )
        }

        val pfd = builder.establish()
            ?: throw IllegalStateException("اتصال VPN برقرار نشد")
        fileDescriptor = pfd
        return pfd.fd
    }

    override fun useProcFS(): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q

    override fun findConnectionOwner(
        ipProtocol: Int,
        sourceAddress: String?,
        sourcePort: Int,
        destinationAddress: String?,
        destinationPort: Int,
    ): ConnectionOwner {
        val owner = ConnectionOwner()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val cm = getSystemService(ConnectivityManager::class.java)
                val uid = cm.getConnectionOwnerUid(
                    ipProtocol,
                    InetSocketAddress(sourceAddress, sourcePort),
                    InetSocketAddress(destinationAddress, destinationPort),
                )
                owner.setUserId(uid)
                val pkgs = packageManager.getPackagesForUid(uid)
                owner.setUserName(pkgs?.firstOrNull() ?: "")
                owner.setProcessPath("")
                owner.setAndroidPackageName(pkgs?.firstOrNull() ?: "")
            }
        } catch (e: Exception) {
            Log.w(TAG, "findConnectionOwner", e)
        }
        return owner
    }

    override fun startDefaultInterfaceMonitor(listener: InterfaceUpdateListener?) {
        pendingListener = listener
        registerNetwork()
        pushDefault()
    }

    override fun closeDefaultInterfaceMonitor(listener: InterfaceUpdateListener?) {
        pendingListener = null
        unregisterNetwork()
    }

    override fun getInterfaces(): NetworkInterfaceIterator {
        val list = ArrayList<NetworkInterface>()
        try {
            val cm = getSystemService(ConnectivityManager::class.java)
            val javaIfs = JavaNetworkInterface.getNetworkInterfaces()?.toList() ?: emptyList()
            for (net in cm.allNetworks) {
                val lp = cm.getLinkProperties(net) ?: continue
                val caps = cm.getNetworkCapabilities(net) ?: continue
                val ifName = lp.interfaceName ?: continue
                val jif = javaIfs.find { it.name == ifName } ?: continue
                val boxIf = NetworkInterface()
                boxIf.setName(ifName)
                boxIf.setIndex(jif.index)
                boxIf.setMTU(runCatching { jif.mtu }.getOrDefault(1500))
                boxIf.setDNSServer(stringIterator(lp.dnsServers.mapNotNull { it.hostAddress }))
                boxIf.setAddresses(
                    stringIterator(jif.interfaceAddresses.mapNotNull { it.address.hostAddress }),
                )
                boxIf.setType(
                    when {
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ->
                            Libbox.InterfaceTypeWIFI
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ->
                            Libbox.InterfaceTypeCellular
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ->
                            Libbox.InterfaceTypeEthernet
                        else -> Libbox.InterfaceTypeOther
                    },
                )
                boxIf.setMetered(!caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED))
                var flags = 0
                if (caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                    flags = flags or 1 or 4 // IFF_UP | IFF_RUNNING
                }
                if (jif.isLoopback) flags = flags or 8
                if (jif.isPointToPoint) flags = flags or 16
                if (jif.supportsMulticast()) flags = flags or 32
                boxIf.setFlags(flags)
                list.add(boxIf)
            }
        } catch (e: Exception) {
            Log.w(TAG, "getInterfaces", e)
        }
        return object : NetworkInterfaceIterator {
            private var i = 0
            override fun hasNext(): Boolean = i < list.size
            override fun next(): NetworkInterface = list[i++]
        }
    }

    override fun underNetworkExtension(): Boolean = false

    override fun includeAllNetworks(): Boolean = false

    override fun readWIFIState(): WIFIState? {
        return try {
            @Suppress("DEPRECATION")
            val wifi = applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? android.net.wifi.WifiManager
            val info = wifi?.connectionInfo ?: return Libbox.newWIFIState("", "")
            var ssid = info.ssid ?: ""
            if (ssid == "<unknown ssid>") return Libbox.newWIFIState("", "")
            if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
                ssid = ssid.substring(1, ssid.length - 1)
            }
            Libbox.newWIFIState(ssid, info.bssid ?: "")
        } catch (e: Exception) {
            Libbox.newWIFIState("", "")
        }
    }

    override fun systemCertificates(): StringIterator {
        val aliases = ArrayList<String>()
        try {
            val ks = java.security.KeyStore.getInstance("AndroidCAStore")
            ks.load(null)
            val it = ks.aliases()
            while (it.hasMoreElements()) aliases.add(it.nextElement())
        } catch (e: Exception) {
            Log.w(TAG, "systemCertificates", e)
        }
        return stringIterator(aliases)
    }

    override fun clearDNSCache() {}

    override fun localDNSTransport(): LocalDNSTransport? = null

    override fun sendNotification(notification: BoxNotification?) {
        notification ?: return
        val mgr = getSystemService(NotificationManager::class.java)
        val channelId = "notif-${notification.getTypeID()}"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mgr.createNotificationChannel(
                NotificationChannel(
                    channelId,
                    notification.getTypeName() ?: "NiniPro",
                    NotificationManager.IMPORTANCE_HIGH,
                ),
            )
        }
        val nb = NotificationCompat.Builder(this, channelId)
            .setShowWhen(false)
            .setContentTitle(notification.getTitle())
            .setContentText(notification.getBody())
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
        val subtitle = notification.getSubtitle()
        if (!subtitle.isNullOrBlank()) nb.setContentInfo(subtitle)
        val url = notification.getOpenURL()
        if (!url.isNullOrBlank()) {
            nb.setContentIntent(
                PendingIntent.getActivity(
                    this, notification.getTypeID(),
                    Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)),
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                        PendingIntent.FLAG_IMMUTABLE else 0,
                ),
            )
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mgr.notify(notification.getIdentifier(), notification.getTypeID(), nb.build())
        } else {
            mgr.cancel(notification.getTypeID())
            mgr.notify(notification.getTypeID(), nb.build())
        }
    }

    // ------------------------------------------------------------ helpers

    private fun stringIterator(items: List<String>): StringIterator {
        val snapshot = items.toTypedArray()
        return object : StringIterator {
            private var i = 0
            override fun hasNext(): Boolean = i < snapshot.size
            override fun next(): String = snapshot[i++]
            override fun len(): Int = snapshot.size
        }
    }

    private fun registerNetwork() {
        unregisterNetwork()
        try {
            val cm = getSystemService(ConnectivityManager::class.java)
            val req = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            val cb = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) = pushDefault()
                override fun onLost(network: Network) = pushDefault()
                override fun onLinkPropertiesChanged(
                    network: Network,
                    lp: android.net.LinkProperties,
                ) = pushDefault()
            }
            cm.registerNetworkCallback(req, cb)
            networkCallback = cb
        } catch (e: Exception) {
            Log.w(TAG, "registerNetwork", e)
        }
    }

    private fun unregisterNetwork() {
        val cb = networkCallback ?: return
        runCatching {
            getSystemService(ConnectivityManager::class.java).unregisterNetworkCallback(cb)
        }
        networkCallback = null
    }

    private fun pushDefault() {
        val listener = pendingListener ?: return
        try {
            val cm = getSystemService(ConnectivityManager::class.java)
            val net = cm.activeNetwork
            if (net == null) {
                listener.updateDefaultInterface("", -1, false, false)
                return
            }
            val lp = cm.getLinkProperties(net) ?: return
            val name = lp.interfaceName ?: ""
            val idx = try {
                JavaNetworkInterface.getByName(name)?.index ?: -1
            } catch (_: Exception) {
                -1
            }
            listener.updateDefaultInterface(name, idx, false, false)
        } catch (e: Exception) {
            Log.w(TAG, "pushDefault", e)
        }
    }
}

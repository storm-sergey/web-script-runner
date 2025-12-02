<script lang="ts">
  import { 
    Ticket, 
    Database, 
    Server, 
    MessageSquare, 
    Play, 
    ShieldAlert, 
    Terminal, 
    CheckCircle, 
    AlertTriangle,
    Loader2,
    RefreshCw,
    Search,
    Moon,
    Sun,
    XOctagon
  } from 'lucide-svelte';

  export let name: string;
  export let size: number = 20;
  export let className: string = "";

  const icons: Record<string, any> = {
    Ticket,
    Database,
    Server,
    MessageSquare,
    Play,
    ShieldAlert,
    Terminal,
    CheckCircle,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Search,
    Moon,
    Sun,
    XOctagon
  };

  $: IconComponent = icons[name] || Terminal;
</script>

<svelte:component this={IconComponent} {size} class={className} />
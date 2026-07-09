using System.Collections;
using UnityEngine;

// Ensures story/cutscene events can run while heartbeat input continues independently.
public class AsyncEventController : MonoBehaviour
{
    public static AsyncEventController Instance { get; private set; }

    void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    // Run an example async event without blocking HeartbeatManager (HeartbeatManager reads Input in Update)
    public void RunCutscene(System.Action onComplete = null)
    {
        StartCoroutine(CutsceneRoutine(onComplete));
    }

    IEnumerator CutsceneRoutine(System.Action onComplete)
    {
        // placeholder conversation/cutscene simulation
        yield return new WaitForSecondsRealtime(2f);
        onComplete?.Invoke();
    }
}

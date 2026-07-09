using UnityEngine;
using UnityEngine.UI;

// Core heartbeat system: handles BPM, shrinking-circle UI and SPACE judgement
public class HeartbeatManager : MonoBehaviour
{
    [Header("Beat Settings")]
    public float bpm = 70f;
    public float beatWindow = 0.16f; // seconds window to judge

    [Header("UI References")]
    public Image circleImage; // should be radial fill image
    public Text statusText;

    public KeyCode beatKey = KeyCode.Space;

    float beatInterval;
    float timer;
    bool beatActive = false;
    float beatStartTime;

    void Start()
    {
        SetBpm(bpm);
        timer = beatInterval;
        if (circleImage != null) circleImage.type = Image.Type.Filled;
        UpdateUIFull();
    }

    void Update()
    {
        if (GameManager.Instance != null && GameManager.Instance.IsMovementPaused) return;

        timer -= Time.deltaTime;

        if (!beatActive && timer <= 0f)
        {
            beatActive = true;
            beatStartTime = Time.time;
            timer += beatInterval; // schedule next beat
            if (circleImage != null) circleImage.fillAmount = 1f;
        }

        if (beatActive)
        {
            float elapsed = Time.time - beatStartTime;
            float t = Mathf.Clamp01(elapsed / beatWindow);
            if (circleImage != null) circleImage.fillAmount = 1f - t;
            if (elapsed > beatWindow)
            {
                beatActive = false;
                OnMiss();
            }
        }

        if (Input.GetKeyDown(beatKey))
        {
            if (beatActive) ResolveBeat();
            else OnMiss();
        }
    }

    void ResolveBeat()
    {
        float elapsed = Time.time - beatStartTime;
        float error = Mathf.Abs(elapsed);

        beatActive = false;
        if (circleImage != null) circleImage.fillAmount = 1f;

        float perfectThresh = beatWindow * 0.25f;
        float goodThresh = beatWindow * 0.7f;

        if (error <= perfectThresh)
        {
            if (statusText != null) statusText.text = "Perfect";
            // TODO: reward/feedback
        }
        else if (error <= goodThresh)
        {
            if (statusText != null) statusText.text = "Good";
        }
        else
        {
            OnMiss();
            return;
        }
    }

    void OnMiss()
    {
        if (statusText != null) statusText.text = "Miss";
        if (GameManager.Instance != null) GameManager.Instance.OnBeatFail("Missed beat");
    }

    public void SetBpm(float newBpm)
    {
        bpm = Mathf.Max(10f, newBpm);
        beatInterval = 60f / bpm;
    }

    void UpdateUIFull()
    {
        if (circleImage != null) circleImage.fillAmount = 1f;
    }
}

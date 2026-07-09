using UnityEngine;

// Minimal stub for mouse pattern recognition used later in prototyping.
public class MouseActionRecognizer : MonoBehaviour
{
    // Recognizer stub: provides API to start/stop recognition and returns boolean for a matched pattern.
    public bool IsRecognizing { get; private set; }

    public void StartRecognition() { IsRecognizing = true; }
    public void StopRecognition() { IsRecognizing = false; }

    // Simple directional drag check: returns true if recent drag approximately matches direction
    public bool CheckDirectionalDrag(Vector2 from, Vector2 to, Vector2 expectedDir, float tolerance = 0.7f)
    {
        Vector2 d = (to - from).normalized;
        return Vector2.Dot(d, expectedDir.normalized) >= tolerance;
    }
}
